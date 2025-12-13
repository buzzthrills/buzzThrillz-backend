// utils/mailchimp.js
const mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY, 
  server: "us18" // <-- THIS must match the last part of your API key
});

module.exports = mailchimp;
