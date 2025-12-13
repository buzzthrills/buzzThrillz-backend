const express = require('express');
const router = express.Router();
const Newsletter = require('../../models/newsletter');
const mailchimp = require("../../utils/mailchimp");
const { sendNewsletterUser, sendNewsletterAdmin } = require('../../utils/nodemailer');

const ADMIN_EMAIL = process.env.MAIL_USER;

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Check if already subscribed in MongoDB
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(200).json({ success: true, message: 'You are already subscribed!' });
    }

    // Save in database
    const newSub = new Newsletter({ email });
    await newSub.save();

    // Add to Mailchimp Audience (LIST)
    await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
      email_address: email,
      status: "subscribed"
    });

    // Send welcome email
    // await sendNewsletterUser(email);

    // Notify admin
    const allSubs = await Newsletter.find({}, { email: 1, _id: 0 });
    await sendNewsletterAdmin(ADMIN_EMAIL, email, allSubs);

    return res.status(201).json({ success: true, message: 'Subscribed successfully!' });

  } catch (error) {
    console.error("MAILCHIMP ERROR:", error.response?.data || error);
    return res.status(500).json({ success: false, message: "Server error, please try again later." });
  }
});

module.exports = router;
