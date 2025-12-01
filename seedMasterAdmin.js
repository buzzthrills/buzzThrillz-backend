// seedMasterAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// const Admin = require('./models/admin');
const { sendMasterAdminCreatedEmail } = require('../utils/nodemailer');
const admin = require('../models/admin');
require('dotenv').config({ path: '../.env' }); 

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Mongo URI:', process.env.MONGO_URI);

    const exists = await admin.findOne({ role: 'master' });
    if (exists) {
        console.log('Master admin already exists');
        process.exit(0);
    }

    const password = 'Ux8mfL6&B25'
    const hashedPassword = await bcrypt.hash(password, 10);

    const masterAdmin = new admin({
        name: 'Super Admin',
        email: 'uflexshuttleservice@gmail.com',
        password: hashedPassword,
        role: 'master',
        number: '08112159041'
    });

    await masterAdmin.save();

    await sendMasterAdminCreatedEmail(masterAdmin.email, masterAdmin.name, password);

    console.log('✅ Master admin created');
    process.exit(0);
};

run();
