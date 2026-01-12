// routes/admin/dashboard.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Admin = require('../../models/admin');
const User = require('../../models/user');
const CallRequest = require('../../models/callRequest');

const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKey";

// POST /api/admin/dashboard
router.post('/', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check if admin exists
    const admin = await Admin.findById(decoded._id);
    if (!admin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total bookings
    const totalBookings = await CallRequest.countDocuments();
    const testBooking = await CallRequest.findOne();
    console.log("Booking user ID:", testBooking.user);
    const userExists = await User.findById(testBooking.user);
    console.log("User exists in current DB?", userExists);


    // Get all bookings (send full object)
    const bookings = await CallRequest.find({ user: { $ne: null } })
      .populate("user", "fullName email phone")
      .populate("subscription", "plan status")
      .sort({ createdAt: -1 })
      .limit(5);


    res.status(200).json({
      totalUsers,
      totalBookings,
      bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
