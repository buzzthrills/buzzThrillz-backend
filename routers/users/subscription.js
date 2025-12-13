// routes/subscription.js
const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Subscription = require("../../models/subscription");
const Plan = require("../../models/plan"); // optional if you have a Plan collection
const { default: axios } = require("axios");



router.post("/initiate-payment", async (req, res) => {
    const { email, planKey } = req.body;
    const user = await User.findOne({ email });
    const plan = await Plan.findOne({ key: planKey });

    if (!user || !plan) return res.status(404).json({ message: "User or plan not found" });

    // You can optionally create a "pending subscription" here to track intent
    const subscription = await Subscription.create({
        user: user._id,
        plan: plan._id,
        status: "pending",
        billingCycle: "monthly",
    });

    res.json({ subscriptionId: subscription._id });
});


router.post("/initiate", async (req, res) => {
    const { email, planKey, billingCycle } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Find the actual plan
        const plan = await Plan.findOne({ key: planKey });
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        // Create subscription
        const subscription = await Subscription.create({
            user: user._id,
            plan: plan._id,
            status: "pending",
            billingCycle: billingCycle || "monthly",
            startDate: new Date(),
            endDate: null,
        });

        // Attach subscription to user
        user.subscription = subscription._id;
        await user.save();

        // Return FULL user with the subscription + plan populated
        const fullUser = await User.findById(user._id)
            .populate({
                path: "subscription",
                populate: { path: "plan" }
            });

        res.json({
            success: true,
            msg: "Subscription created successfully",
            subscriptionId: subscription._id, // <-- add this
            user: fullUser
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/verify", async (req, res) => {
    const { reference, subscriptionId } = req.body;

    try {
        const paystackRes = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );

        if (paystackRes.data.data.status === "success") {
            const subscription = await Subscription.findById(subscriptionId);
            subscription.status = "active"; // activate subscription
            subscription.startDate = new Date();
            subscription.endDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
            await subscription.save();

            // Attach subscription to user
            const user = await User.findById(subscription.user);
            user.subscription = subscription._id;
            await user.save();

            // return populated user
            const fullUser = await User.findById(user._id).populate({
                path: "subscription",
                populate: { path: "plan" }
            });

            return res.json({ success: true, user: fullUser });
        } else {
            return res.status(400).json({ message: "Payment not successful" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Verification failed" });
    }
});



module.exports = router;
