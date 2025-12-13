const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },

  status: { type: String, enum: ["active", "inactive", "cancelled", "pending"], default: "pending" },

  billingCycle: { type: String, enum: ["monthly", "quarterly", "yearly"], default: "monthly" },
  autoRenew: { type: Boolean, default: true },

  startDate: Date,
  endDate: Date,

  // Count how many calls they used this month
  callsUsed: { type: Number, default: 0 },

  preferences: { type: mongoose.Schema.Types.ObjectId, ref: "Preferences" },

  corporateDetails: { type: mongoose.Schema.Types.ObjectId, ref: "CorporateDetails" }, // optional

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);