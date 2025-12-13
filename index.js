const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('./utils/cloudinary'); // Use server-side Cloudinary
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, msg: 'No file uploaded' });

        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'products' },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };

        const result = await streamUpload(req.file.buffer);

        res.json({
            success: true,
            public_id: result.public_id,
            url: result.secure_url,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

// User Routes
// app.use('/user_product', require('./routes/users/product'));
app.use('/user_auth', require('./routers/users/auth'));
app.use('/user_subscription', require('./routers/users/subscription'));
app.use('/user_dashboard', require('./routers/users/dashboard'));
// app.use('/user_cart', require('./routes/users/cart'));
// app.use('/user_order', require('./routes/users/order'));
app.use('/user_newsletter', require('./routers/users/newsletter'));



// Admin Routes
app.use('/admin_auth', require('./routers/admin/auth'));
app.use('/admin_mail', require('./routers/admin/mail'));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
