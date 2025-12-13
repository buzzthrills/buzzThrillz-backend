const mongoose = require("mongoose");
const Plan = require("../models/Plan");

mongoose.connect("mongodb+srv://jason0j0j_db_user:vOhhSbHfsZlwKkod@cluster0.0whyrct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(async () => {
    console.log("Connected!");

    const plans = [
        { key: "lite", name: "Buzz Lite", price: 15000, maxCalls: 12, description: "12 surprise calls" },
        { key: "plus", name: "Buzz Plus", price: 30000, maxCalls: 25, description: "25 surprise calls" },
        { key: "orbit", name: "Buzz Orbit", price: 60000, maxCalls: 60, description: "60 surprise calls" },
        { key: "corporate", name: "Corporate", price: 150000, maxCalls: 200, description: "Corporate plan" },
    ];

    await Plan.deleteMany({});
    await Plan.insertMany(plans);

    console.log("Plans added!");
    process.exit();
});
