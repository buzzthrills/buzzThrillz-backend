const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: String,
  name: String,

  email: String,
  password: String,
  is_online: { type: Boolean, default: false },
  role: { type: String, enum: ["master", "standard"], default: "standard" },
  is_block: { type: Boolean, default: false },
}, { collection: 'admin', timestamps: true  });

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
