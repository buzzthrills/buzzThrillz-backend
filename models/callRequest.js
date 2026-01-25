const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: String,
  occasionType: String,
  date: String,
  time: String,
  callType: String,
  message: String,
  specialInstructions: String,
  voiceNoteUrl: String,
  preferredCaller: String,

  // NEW: store uploaded files per recipient
  files: [
    {
      url: String,
      public_id: String,
      uploadedAt: Date,
    }
  ]
});



const CallRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },

  recipient: { type: RecipientSchema, required: true },

  scheduledFor: Date,  // actual scheduled datetime
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
