const mongoose = require("mongoose");

const certificationRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cvUrl: { type: String },
  experience: { type: String },
  motivation: { type: String },
  techExpertise: [{ type: String }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

module.exports = mongoose.model("CertificationRequest", certificationRequestSchema);
