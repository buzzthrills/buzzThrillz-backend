const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const { sendOTP } = require("../../utils/nodemailer");

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword
    });


    return res.status(201).json({
      msg: "Signup successful",
      token,
      user: { _id: user._id, fullName, email, phone }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});
// POST /auth/login// POST /auth/login (email only)
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });


    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // TODO: send OTP via email
    console.log("OTP (for testing):", otp);
    sendOTP(email, otp);

    return res.json({
      msg: "OTP sent to your email", token, user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /auth/create-password
router.post("/create-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Prevent overwriting existing password
    if (user.password) {
      return res.status(400).json({
        msg: "Password already created. Please login instead."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      msg: "Password created successfully. Please login."
    });

  } catch (error) {
    console.error("Create Password Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


// POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    const user = await User.findOne({ email })
      .populate({
        path: "subscription",
        populate: { path: "plan" }
      });
    if (!user || !user.otp) {
      return res.status(400).json({ msg: "Invalid request" });
    }

    // Check OTP expiration
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    // Compare OTP
    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // ✅ Reset OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const subscription = user.subscription;

    let totalCalls = 0;
    let remainingCalls = 0;

    if (subscription?.plan?.maxCalls !== undefined) {
      totalCalls = subscription.plan.maxCalls;
      remainingCalls = Math.max(
        totalCalls - (subscription.callsUsed || 0),
        0
      );
    }


    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiresAt;

    if (userObj.subscription) {
      userObj.subscription.totalCalls = totalCalls;
      userObj.subscription.remainingCalls = remainingCalls;
    }

    return res.json({
      msg: "Login successful",
      token,
      user: userObj,
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
