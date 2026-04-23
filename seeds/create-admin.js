const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/mongo/User"); // adjust path if needed

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const password = "admin123"; // change this later
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: "DevRank Admin",
      username: "admin",
      email: "admin@devrank.com",
      passwordHash,
      role: "admin",
      isVerifiedReviewer: true,
      reviewerStatus: "approved",
    });

    console.log("✅ Admin created:");
    console.log({
      email: admin.email,
      username: admin.username,
      password: password,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();