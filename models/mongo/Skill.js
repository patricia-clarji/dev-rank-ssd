const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: {
    type: [String],
    enum: ["frontend", "backend", "devops", "database", "mobile", "other"],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "At least one category is required.",
    },
    required: true,
  },
  isPreset: { type: Boolean, default: false },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Skill", skillSchema);
