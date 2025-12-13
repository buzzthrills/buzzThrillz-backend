const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema({
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },

  name: String,
  phone: String,
  relationship: String,

  // signals what they want
  occasionType: String,
  occasionDate: Date,
  preferredTime: String,

  callType: String,
  customMessage: String,
  specialInstructions: String,

  // orbit extras
  preferredCaller: String,
  voiceNote: String, // file path
  dedicatedSupport: Boolean,

  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Recipient", RecipientSchema);