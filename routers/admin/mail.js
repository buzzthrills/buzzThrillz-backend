// routes/newsletter.js
const express = require("express");
const router = express.Router();
const Newsletter = require("../../models/newsletter");
const Admin = require("../../models/admin");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
});

// Send newsletter
router.post("/send_mail", async (req, res) => {
  try {
    const { subject, message, image, token } = req.body;

    // 1️⃣ Verify admin via JWT
    if (!token) return res.status(401).json({ error: "No token provided" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const admin = await Admin.findById(decoded._id);
    if (!admin) return res.status(401).json({ error: "Unauthorized admin" });

    // 2️⃣ Validate newsletter content
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject & message required" });
    }

    // 3️⃣ Get all subscribers
    const subscribers = await Newsletter.find({});
    const emails = subscribers.map((s) => s.email);

    if (emails.length === 0) return res.status(400).json({ error: "No subscribers found" });

    // 4️⃣ Build HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${subject}</h2>
        <p>${message}</p>
        ${image ? `<img src="${image}" style="max-width: 100%; margin-top: 20px;" />` : ""}
        <hr/>
        <p style="font-size: 12px; color: gray;">Thank you for subscribing.</p>
      </div>
    `;

    // 5️⃣ Send email
    await transporter.sendMail({
      from: `Newsletter Service <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Gmail requires a "to"
      bcc: emails,
      subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: "Newsletter sent to all subscribers" });

  } catch (err) {
    console.error("Send newsletter error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
