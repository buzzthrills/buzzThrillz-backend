import crypto from "crypto";
import axios from "axios";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_SERVER_PREFIX;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

const mailchimp = axios.create({
    baseURL: `https://${SERVER}.api.mailchimp.com/3.0`,
    headers: {
        Authorization: `apikey ${API_KEY}`,
        "Content-Type": "application/json",
    },
});

// 🔥 Add / update user + apply tag
export const addUserToPaidTag = async (email, firstName, lastName, tagName = "paid_user") => {
  const subscriberHash = crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

  try {
    // 1️⃣ Add/update contact
    const addRes = await mailchimp.put(`/lists/${AUDIENCE_ID}/members/${subscriberHash}`, {
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: { FNAME: firstName || "", LNAME: lastName || "" },
    });
    console.log("Mailchimp add/update contact response:", addRes.data);

    // 2️⃣ Add tag
    const tagRes = await mailchimp.post(
      `/lists/${AUDIENCE_ID}/members/${subscriberHash}/tags`,
      { tags: [{ name: tagName, status: "active" }] }
    );
    console.log("Mailchimp tag response:", tagRes.data);

  } catch (err) {
    console.error("Mailchimp API error:", err.response?.data || err.message);
  }
};

