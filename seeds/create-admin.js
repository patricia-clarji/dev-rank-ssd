const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/mongo/User"); // adjust path if needed

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    if (existingSuperAdmin) {
      console.log("⚠️ Super admin already exists");
      process.exit(0);
    }

    const password = "admin123"; // change this later
    const passwordHash = await bcrypt.hash(password, 10);

    let admin = await User.findOne({ username: "admin" });
    if (admin) {
      admin.role = "admin";
      admin.isSuperAdmin = true;
      admin.isVerifiedReviewer = true;
      admin.reviewerStatus = "approved";
      admin.passwordHash = passwordHash;
      await admin.save();
    } else {
      admin = await User.create({
        name: "DevRank Admin",
        username: "admin",
        email: "admin@devrank.com",
        passwordHash,
        role: "admin",
        isSuperAdmin: true,
        isVerifiedReviewer: true,
        reviewerStatus: "approved",
      });
    }

    console.log("✅ Admin created:");
    console.log({
      email: admin.email,
      username: admin.username,
      password: password,
      isSuperAdmin: true,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();