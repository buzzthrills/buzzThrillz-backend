const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CallRequest = require('../../models/callRequest');
const User = require('../../models/user');

// GET /api/admin/call-requests
router.post("/call-requests", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized, token required" });
        }

        // Verify admin token (replace YOUR_SECRET_KEY)
        try {
            jwt.verify(token, process.env.JWT_SECRET || "YOUR_SECRET_KEY");
        } catch (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        // Fetch all call requests
        const callRequests = await CallRequest.find()
            .populate("user", "fullName email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({ callRequests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/admin/call-requests/:id/complete
router.post("/call-requests/:id/complete", async (req, res) => {
    try {
        const { token } = req.body;
        const { id } = req.params;

        if (!token) {
            return res.status(401).json({ message: "Token required" });
        }

        // Verify admin token
        try {
            jwt.verify(token, process.env.JWT_SECRET || "YOUR_SECRET_KEY");
        } catch {
            return res.status(403).json({ message: "Invalid token" });
        }

        const callRequest = await CallRequest.findById(id);

        if (!callRequest) {
            return res.status(404).json({ message: "Call request not found" });
        }

        if (callRequest.status === "completed") {
            return res.status(400).json({ message: "Already completed" });
        }

        callRequest.status = "completed";
        callRequest.completedAt = new Date();

        await callRequest.save();

        res.status(200).json({
            message: "Call marked as completed",
            callRequest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
