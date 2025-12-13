const mongoose = require("mongoose");

const CorporateDetailsSchema = new mongoose.Schema({
  companyName: String,
  contactPerson: String,
  position: String,
  email: String,
  phone: String,
  companySize: Number,
  department: String,

  callTypesNeeded: [String],
  preferredTone: String,

  scriptUpload: String, // file

  staffSpreadsheet: String, // uploaded file
});

module.exports = mongoose.model("CorporateDetails", CorporateDetailsSchema);