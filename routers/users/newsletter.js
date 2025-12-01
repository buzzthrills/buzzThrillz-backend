const express = require('express');
const router = express.Router();
const Newsletter = require('../../models/newsletter');
const { sendNewsletterUser, sendNewsletterAdmin } = require('../../utils/nodemailer');
require('dotenv').config();

// Admin email
const ADMIN_EMAIL = process.env.MAIL_USER || "admin@example.com";

router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Check if already subscribed
        const existing = await Newsletter.findOne({ email });
        if (existing) {
            return res.status(200).json({ success: true, message: 'You are already subscribed!' });
        }

        // Save new subscriber
        const newSub = new Newsletter({ email });
        await newSub.save();

        // Send welcome email to subscriber
        await sendNewsletterUser(email);

        // Get all subscribers
        const allSubs = await Newsletter.find({}, { email: 1, _id: 0 });

        // Send notification email to admin
        await sendNewsletterAdmin(ADMIN_EMAIL, email, allSubs);

        res.status(201).json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Newsletter Error:', error);
        res.status(500).json({ success: false, message: 'Server error, please try again later.' });
    }
});

module.exports = router;