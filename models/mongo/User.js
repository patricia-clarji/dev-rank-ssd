const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["developer", "reviewer", "admin"],
    default: "developer",
  },
  bio: { type: String },
  company: { type: String },
  location: { type: String },
  githubUrl: { type: String },
  linkedin: { type: String },
  website: { type: String },
  avatarUrl: { type: String },
  isVerifiedReviewer: { type: Boolean, default: false },
  reviewerStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  profileScore: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  joinedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
