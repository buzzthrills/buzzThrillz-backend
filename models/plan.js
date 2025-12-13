
const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
    key: { type: String, enum: ["lite", "plus", "orbit", "corporate"], unique: true },
    name: String,
    price: Number,
    maxCalls: Number,
    description: String
});
module.exports = mongoose.model("Plan", PlanSchema);

