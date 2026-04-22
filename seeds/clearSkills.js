require("dotenv").config();
const mongoose = require("mongoose");
const Skill = require("../models/mongo/Skill");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Skill.deleteMany({});
  console.log("All skills deleted.");
  process.exit(0);
});