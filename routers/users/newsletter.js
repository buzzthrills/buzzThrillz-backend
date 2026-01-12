const express = require('express');
const router = express.Router();
const Newsletter = require('../../models/newsletter');
const mailchimp = require("../../utils/mailchimp");
const { sendNewsletterUser, sendNewsletterAdmin } = require('../../utils/nodemailer');

const ADMIN_EMAIL = process.env.MAIL_USER;

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address'
    });
  }

  try {
    // ⏱️ Mailchimp with timeout
    await Promise.race([
      mailchimp.lists.addListMember(
        process.env.MAILCHIMP_AUDIENCE_ID,
        { email_address: email, status: "subscribed" }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Mailchimp timeout")), 7000)
      )
    ]);

    // ✅ DB sync (safe)
    await Newsletter.updateOne(
      { email },
      { email },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Subscribed successfully!'
    });

  } catch (error) {
    const mcError = error.response?.data;

    // ✅ Mailchimp duplicate = success
    if (mcError?.title === "Member Exists") {
      await Newsletter.updateOne(
        { email },
        { email },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'You are already subscribed!'
      });
    }

    console.error("MAILCHIMP ERROR:", mcError || error.message);

    return res.status(500).json({
      success: false,
      message: "Subscription failed. Please try again."
    });
  }
});



module.exports = router;
