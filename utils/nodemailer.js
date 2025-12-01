const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


// Master Admin Created Email
const sendMasterAdminCreatedEmail = async (email, fullname, password) => {
  try {
    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Master Admin Account Created",
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>Hello ${fullname},</h2>
          <p>Your Master Admin account has been successfully created.</p>
          <p><strong>Login Credentials:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            <li>Password: ${password}</li>
          </ul>
          <p>Please login and change your password immediately for security reasons.</p>
          <p>Thank you,<br/>Team BuzzThrills</p>
        </div>
      `,
    });
    console.log("Master admin email sent:", info.response);
  } catch (err) {
    console.error("Error sending master admin email:", err);
  }
};


// Payment confirmation email to user
const sendPaymentConfirmationUser = async (userEmail, order) => {
  try {
    console.log(process.env.EMAIL_PASS, process.env.EMAIL_USER);
    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
      to: userEmail,
      subject: "Payment Successful - Order Confirmed",
      html: `<p>Hi ${order.user.fullName},</p>
             <p>Your payment for order <strong>${order._id}</strong> has been successfully processed.</p>
             <p>Total Paid: ₦${order.totalAmount}</p>
             <p>Payment Reference: ${order.paymentReference}</p>
             <p>Thank you for shopping with us!</p>`
    });
    console.log("Payment confirmation sent to user:", info.response);
  } catch (err) {
    console.error("Error sending payment confirmation to user:", err);
  }
};
// Payment notification email to admin
const sendPaymentNotificationAdmin = async (adminEmail, order) => {
  try {
    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
      to: adminEmail,
      subject: "New Payment Received",
      html: `<p>Payment received for order <strong>${order._id}</strong>.</p>
             <p>User: ${order.user.fullName} (${order.address.email})</p>
             <p>Total Amount: ₦${order.totalAmount}</p>
             <p>Payment Reference: ${order.paymentReference}</p>`
    });
    console.log("Payment notification sent to admin:", info.response);
  } catch (err) {
    console.error("Error sending payment notification to admin:", err);
  }
};

// Password reset email
const sendPasswordReset = async (email, fullname, resetPasswordCode) => {
  try {
    const info = await transport.sendMail({
      from: `MedStock`,
      to: email,
      subject: "Reset your password",
      html: `<div>...existing HTML...</div>`,
      headers: { "Content-Type": "multipart/mixed" },
    });
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

// OTP email
const sendOTP = async (email, otp) => {
  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "One Time Password",
      html: `<p style="line-height: 1.5">
        Your OTP verification code is: <br /> <br />
        <font size="3">${otp}</font> <br />
        Best regards,<br />
        Team MiniProject.
        </p>`,
    });
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

// Newsletter welcome email to user
const sendNewsletterUser = async (email) => {
  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to our Newsletter!",
      html: `<p>Hi there,</p>
             <p>Thank you for subscribing to our newsletter! You will now receive updates and exclusive offers.</p>
             <p>Cheers, <br/> Team</p>`
    });
    console.log("Newsletter email sent to user:", info.response);
  } catch (error) {
    console.error("Error sending newsletter email to user:", error);
  }
};

// Newsletter notification email to admin
const sendNewsletterAdmin = async (adminEmail, subscriberEmail, allSubscribers) => {
  try {
    const emailsList = allSubscribers.map(sub => sub.email).join('<br/>');
    const info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: "New Newsletter Subscriber",
      html: `<p>New user subscribed: ${subscriberEmail}</p>
             <p>Current subscribers list:</p>
             <p>${emailsList}</p>`
    });
    console.log("Newsletter email sent to admin:", info.response);
  } catch (error) {
    console.error("Error sending newsletter email to admin:", error);
  }
};

module.exports = {
  sendPasswordReset,
  sendOTP,
  sendNewsletterUser,
  sendNewsletterAdmin,
  sendPaymentNotificationAdmin,
  sendPaymentConfirmationUser,
  sendMasterAdminCreatedEmail, // <- add here

};
