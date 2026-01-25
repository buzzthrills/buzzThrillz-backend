const express = require("express")
const bcrypt =  require("bcryptjs");
const admin = require("../../models/admin")

const router = express.Router();

// ✅ Get all admins
router.post("/all", async (req, res) => {
  try {
    const admins = await admin.find();
    res.json({ success: true, data: { admins } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add a new admin
router.post("/create", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await admin.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newAdmin = await admin.create({ name, email, password: hashed, role });
    res.json({ success: true, data: newAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Update role
router.put("/edit-role", async (req, res) => {
  try {
    const { id, role } = req.body;
    const adminM = await admin.findById(id);
    if (!adminM) return res.status(404).json({ success: false, message: "Admin not found" });

    adminM.role = role;
    await adminM.save();
    res.json({ success: true, data: adminM });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Deactivate admin
router.put("/deactivate", async (req, res) => {
  try {
    const { id } = req.body;
    const adminM = await admin.findById(id);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    adminM.is_block = true;
    await adminM.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Activate admin
router.put("/activate", async (req, res) => {
  try {
    const { id } = req.body;
    const adminM = await admin.findById(id);
    if (!adminM) return res.status(404).json({ success: false, message: "Admin not found" });

    adminM.is_block = false;
    await adminM.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
