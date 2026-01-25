// ===============================
// 1️⃣ BOOTSTRAP
// ===============================
require("dotenv").config();

// ===============================
// 2️⃣ DNS FIX (CRITICAL FOR ATLAS)
// ===============================
const dnsPromises = require("node:dns/promises");
const dns = require("dns");

dnsPromises.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

// ===============================
// 3️⃣ IMPORTS
// ===============================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("./utils/cloudinary");

// ===============================
// 4️⃣ ENV VALIDATION
// ===============================
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
const PORT = process.env.PORT || 4000;

if (!MONGO_URI) {
  console.error("❌ MongoDB connection string missing");
  process.exit(1);
}

// ===============================
// 5️⃣ APP INIT
// ===============================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===============================
// 6️⃣ MONGODB CONNECTION
// ===============================
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("🟢 MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ===============================
// 7️⃣ FILE UPLOAD SETUP
// ===============================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===============================
// 8️⃣ UPLOAD ROUTE
// ===============================
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "No file uploaded" });
    }

    const streamUpload = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );

        streamifier.createReadStream(buffer).pipe(stream);
      });

    const result = await streamUpload(req.file.buffer);

    res.json({
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch {
    res.status(500).json({ success: false, msg: "Upload failed" });
  }
});

// ===============================
// 9️⃣ ROUTES
// ===============================
app.use("/user_auth", require("./routers/users/auth"));
app.use("/user_subscription", require("./routers/users/subscription"));
app.use("/user_dashboard", require("./routers/users/dashboard"));
app.use("/user_newsletter", require("./routers/users/newsletter"));

app.use("/admin_auth", require("./routers/admin/auth"));
app.use("/admin_mail", require("./routers/admin/mail"));
app.use("/admin_dashboard", require("./routers/admin/dashboard"));
app.use("/admin_request", require("./routers/admin/Request"));
app.use("/admin_admin", require("./routers/admin/admin"));

// ===============================
// 🔟 SERVER START
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
