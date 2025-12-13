const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Subscription = require("../../models/subscription");
const CallRequest = require("../../models/callRequest");

// POST /api/subscription/book-call
router.post("/book-call", async (req, res) => {
    try {
        const { userId, subscriptionId, recipientInfo } = req.body;

        // 1️⃣ Validate required fields
        if (!userId || !subscriptionId || !recipientInfo) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const { date, time, name, phone } = recipientInfo;

        if (!date || !time || !name || !phone) {
            return res.status(400).json({ message: "Recipient name, phone, date and time are required" });
        }

        const scheduledFor = new Date(`${date}T${time}`);
        if (isNaN(scheduledFor.getTime())) {
            return res.status(400).json({ message: "Invalid date or time" });
        }

        // 2️⃣ Find user & subscription
        const user = await User.findById(userId);
        const subscription = await Subscription.findById(subscriptionId);

        if (!user || !subscription) {
            return res.status(404).json({ message: "User or subscription not found" });
        }

        // 3️⃣ Create CallRequest
        const callRequest = await CallRequest.create({
            user: user._id,
            subscription: subscription._id,
            recipient: {
                name: recipientInfo.name,
                phone: recipientInfo.phone,
                relationship: recipientInfo.relationship || "",
                occasionType: recipientInfo.occasionType || "",
                date,
                time,
                callType: recipientInfo.callType || "Birthday Call",
            },
            scheduledFor,
            callType: recipientInfo.callType || "Birthday Call",
            message: recipientInfo.message || "",
            status: "pending",
        });

        res.status(201).json({
            message: "Call booked successfully",
            callRequest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/subscription/call-history/:userId
// GET /api/subscription/call-history/:userId
router.get("/call-history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const calls = await CallRequest.find({ user: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Call history fetched successfully",
            calls,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
