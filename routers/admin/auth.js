const express = require('express');
const router = express.Router();
const Admin = require('../../models/admin');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

// Register an Admin
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if the email, username or password was sent 
        if (!username || !email || !password) {
            return res.status(400).send({ status: 'fail', msg: 'Please fill in all the fields' });
        }

        // Check if the email already exists in the database
        const existData = await admin.findOne({ email });
        if (existData) {
            return res.status(400).send({ status: 'fail', msg: 'Email already exists in the database' });
        }

        // Hash the user password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Admin
        const admin = new Admin({
            username,
            email,
            password: hashedPassword
        });

        const savedAdmin = await admin.save();
        res.status(201).send({ status: 'success', msg: 'Admin registered successfully', admin: savedAdmin });

    } catch (error) {
        console.error('Error registering admin', error);
        res.status(500).send({ status: 'fail', msg: 'Internal server error' });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).send({ status: 'fail', msg: 'Invalid email or password' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).send({ status: 'fail', msg: 'Invalid email or password' });
        }

        // Create a JWT token
        const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: '6h' });
        admin.is_online = true;

        await admin.save();

        res.status(200).send({ status: 'success', msg: 'Login successful', token, admin });

    } catch (error) {
        console.error('Error logging in', error);
        res.status(500).send({ status: 'fail', msg: 'Internal server error' });
    }
});

module.exports = router;
