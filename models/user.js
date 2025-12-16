const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    phone: String,
    password: { type: String },
    preferredContact: { type: String, enum: ["call", "whatsapp", "email"] },

    // Relationship with subscriptions
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);