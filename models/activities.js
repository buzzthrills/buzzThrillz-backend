const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema({
  action: String,
  admin: String,
  details: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("AdminLog", AdminLogSchema);