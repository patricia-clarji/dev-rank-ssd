const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  repoUrl: { type: String },
  liveUrl: { type: String },
  techStack: [{ type: String }],
  status: {
    type: String,
    enum: ["seeking-review", "under-review", "reviewed", "archived"],
    default: "seeking-review",
  },
  aggregateRating: { type: Number, default: 0 },
  aggregateCodeQuality: { type: Number, default: 0 },
  aggregateCreativity: { type: Number, default: 0 },
  aggregateCleanCode: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  hireVotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
