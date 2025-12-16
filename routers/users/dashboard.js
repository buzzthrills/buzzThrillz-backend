const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Subscription = require("../../models/subscription");
const CallRequest = require("../../models/callRequest");

// POST /api/subscription/book-call
router.post("/book-call", async (req, res) => {
  try {
    const { subscriberInfo, recipientInfo } = req.body;

    // 1️⃣ Validate subscriber info
    if (!subscriberInfo?.email || !subscriberInfo?.phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    // 2️⃣ Validate recipient info
    const { date, time, name, phone } = recipientInfo || {};
    if (!date || !time || !name || !phone) {
      return res.status(400).json({
        message: "Recipient name, phone, date and time are required",
      });
    }

    const scheduledFor = new Date(`${date}T${time}`);
    if (isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: "Invalid date or time" });
    }

    // 3️⃣ Find user
    const user = await User.findOne({
      $or: [
        { email: subscriberInfo.email },
        { phone: subscriberInfo.phone },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found. Please subscribe to book a call.",
      });
    }

    // 4️⃣ Find active subscription + plan
    const subscription = await Subscription
      .findOne({ user: user._id, status: "active" })
      .populate("plan");

    if (!subscription) {
      return res.status(403).json({
        message: "No active subscription found for this user",
      });
    }

    // 5️⃣ Enforce call limit
    const remainingCalls =
      subscription.plan.maxCalls - subscription.callsUsed;

    if (remainingCalls <= 0) {
      return res.status(403).json({
        message: "You have used all your available calls for this plan",
      });
    }

    // 6️⃣ Create CallRequest
    const callRequest = await CallRequest.create({
      user: user._id,
      subscription: subscription._id,
      recipient: {
        name,
        phone,
        relationship: recipientInfo.relationship || "",
        occasionType: recipientInfo.occasionType || "",
        date,
        time,
      },
      scheduledFor,
      callType: recipientInfo.callType || "Birthday Call",
      message: recipientInfo.message || "",
      status: "pending",
    });

    // 7️⃣ Increment callsUsed (consume 1 call)
    subscription.callsUsed += 1;
    await subscription.save();

    res.status(201).json({
      message: "Call booked successfully",
      remainingCalls: remainingCalls - 1,
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
