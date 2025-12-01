const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  is_online: { type: Boolean, default: false }
}, { collection: 'admin' });

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
