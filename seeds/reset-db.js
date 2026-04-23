const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const sequelize = require("../config/sqlite");

const resetMongo = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;

    console.log("🧨 Dropping MongoDB database...");
    await db.dropDatabase();

    console.log("✅ MongoDB database dropped");

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Mongo reset error:", err.message);
  }
};

const resetSQLite = async () => {
  try {
    const dbPath = path.join(__dirname, "..", "devrank.sqlite");

    console.log("🧨 Closing SQLite connection...");
    await sequelize.close();

    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log("✅ SQLite file deleted");
    } else {
      console.log("⚠️ SQLite file not found");
    }
  } catch (err) {
    console.error("❌ SQLite reset error:", err.message);
  }
};

const run = async () => {
  console.log("\n🚀 Resetting databases...\n");

  await resetMongo();
  await resetSQLite();

  console.log("\n🎉 All databases reset successfully!");
  process.exit(0);
};

run();