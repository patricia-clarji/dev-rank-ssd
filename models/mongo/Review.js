const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  codeQualityScore: { type: Number, required: true, min: 1, max: 5 },
  creativityScore: { type: Number, required: true, min: 1, max: 5 },
  cleanCodeScore: { type: Number, required: true, min: 1, max: 5 },
  wouldHire: { type: Boolean },
  generalFeedback: { type: String },
  suggestions: [{ type: String }],
  status: {
    type: String,
    enum: ["published", "removed"],
    default: "published",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);
