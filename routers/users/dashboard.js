const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Subscription = require("../../models/subscription");
const CallRequest = require("../../models/callRequest");
const user = require("../../models/user");
const jwt = require("jsonwebtoken")

// POST /api/subscription/book-call
router.post("/book-call", async (req, res) => {
  try {
    const { subscriberInfo, recipients } = req.body;

    // 1️⃣ Validate subscriber info
    if (!subscriberInfo?.email || !subscriberInfo?.phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    // 2️⃣ Validate recipients array
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "At least one recipient is required" });
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

    // 4️⃣ Find active subscription
    const subscription = await Subscription
      .findOne({ user: user._id, status: "active" })
      .populate("plan");

    if (!subscription) {
      return res.status(403).json({
        message: "No active subscription found for this user",
      });
    }

    // 5️⃣ Enforce call limit FIRST
    const remainingCalls =
      subscription.plan.maxCalls - subscription.callsUsed;

    if (recipients.length > remainingCalls) {
      return res.status(403).json({
        message: "Not enough remaining calls for this booking",
      });
    }

    // 6️⃣ Create CallRequests
    const callRequests = [];

    for (const recipient of recipients) {
      const { name, phone, date, time } = recipient;

      if (!name || !phone || !date || !time) continue;

      const scheduledFor = new Date(`${date}T${time}`);
      if (isNaN(scheduledFor.getTime())) continue;

      const callRequest = await CallRequest.create({
        user: user._id,
        subscription: subscription._id,
        recipient: {
          name,
          phone,
          relationship: recipient.relationship || "",
          occasionType: recipient.occasionType || "",
          date,
          time,
          callType: recipient.callType || "",
          message: recipient.message || "",
        },
        scheduledFor,
        status: "pending",
      });

      callRequests.push(callRequest);
    }

    // 7️⃣ Update calls used
    subscription.callsUsed += callRequests.length;
    await subscription.save();

    res.status(201).json({
      message: "Calls booked successfully",
      bookedCalls: callRequests.length,
      remainingCalls: remainingCalls - callRequests.length,
      callRequests,
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


router.post("/my_profile", async (req, res) => {

  const { token } = req.body;

  // Verify token and extract user ID

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Iuser = await user.findById(decoded.id)
      .select("-password -otp -otpExpiresAt")
      .populate({
        path: "subscription",
        populate: { path: "plan" },
      });

    if (!Iuser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Stats
    const totalBookings = await CallRequest.countDocuments({
      user: Iuser._id,
    });

    const peopleCalled = await CallRequest.countDocuments({
      user: Iuser._id,
      status: "completed",
    });

    res.json({
      user: Iuser,
      stats: {
        totalBookings,
        peopleCalled,
        currentPackage: Iuser.subscription?.plan?.name || "N/A",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/update-name", async (req, res) => {
  const { token, fullName } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!fullName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName },
      { new: true }
    ).select("-password -otp -otpExpiresAt");

    res.json({
      message: "Name updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/my_recipients", async (req, res) => {

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch all call bookings made by this user
    const calls = await CallRequest.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("recipient status scheduledFor createdAt");

    // Extract recipients cleanly
    const recipients = calls.map(call => ({
      recipient: call.recipient,
      status: call.status,
      scheduledFor: call.scheduledFor,
      bookedAt: call.createdAt,
    }));

    res.json({
      success: true,
      data: recipients,
    });
  } catch (error) {
    console.error("Get recipients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
})


module.exports = router;
