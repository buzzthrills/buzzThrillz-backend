const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  amount: Number,
  isSuccessful: Boolean,

  provider: String, // Paystack / Flutterwave
  reference: String,

  paidAt: Date,
});

module.exports = mongoose.model("Payment", PaymentSchema);