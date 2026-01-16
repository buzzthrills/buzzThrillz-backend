// routes/subscription.js
const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Subscription = require("../../models/subscription");
const Plan = require("../../models/plan"); // optional if you have a Plan collection
const { default: axios } = require("axios");
const { addUserToPaidTag } = require("../../functions/mailchimp");



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
        if (!email || !planKey) {
            return res.status(400).json({ message: "Email and planKey are required" });
        }

        // 1️⃣ Find user
        let user = await User.findOne({ email }).populate({
            path: "subscription",
            populate: { path: "plan" },
        });

        // 1a️⃣ Check for active subscription
        if (user?.subscription && user.subscription.status === "active") {
            return res.status(400).json({
                message: "This email already has an active subscription",
                subscriptionId: user.subscription._id,
            });
        }

        // 1b️⃣ Create user if not exists
        if (!user) {
            user = await User.create({
                email,
                role: "user", // or null / default
                createdAt: new Date(),
            });
        }

        // 2️⃣ Find plan
        const plan = await Plan.findOne({ key: planKey });
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // 3️⃣ Create subscription
        const subscription = await Subscription.create({
            user: user._id,
            plan: plan._id,
            status: "pending",
            billingCycle: billingCycle || "monthly",
            startDate: new Date(),
            endDate: null,
        });

        // 4️⃣ Attach subscription to user
        user.subscription = subscription._id;
        await user.save();

        // 5️⃣ Return populated user
        const fullUser = await User.findById(user._id).populate({
            path: "subscription",
            populate: { path: "plan" },
        });

        res.status(200).json({
            success: true,
            msg: "Subscription initiated successfully",
            subscriptionId: subscription._id,
            user: fullUser,
        });

    } catch (err) {
        console.error("Subscription initiate error:", err);
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
            subscription.status = "active";
            subscription.startDate = new Date();
            subscription.endDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
            await subscription.save();

            const user = await User.findById(subscription.user);
            user.subscription = subscription._id;
            await user.save();

            // 🔥 ADD TO MAILCHIMP TAG
            // 🔥 ADD TO MAILCHIMP TAG
            await addUserToPaidTag(
                user.email,
                user.firstName,
                user.lastName,
                "paid_user" // or "pro_plan", "monthly_subscriber"
            );

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
