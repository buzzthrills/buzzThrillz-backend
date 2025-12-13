const mongoose = require("mongoose");
const CallRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  
  recipient: {
    name: String,
    phone: String,
    relationship: String,
    occasionType: String,
    date: String,
    time: String,
    callType: String,
  },

  scheduledFor: Date,
  callType: String,
  message: String,
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "rescheduled"], 
    default: "pending" 
  },
  completedAt: Date,
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("CallRequest", CallRequestSchema);