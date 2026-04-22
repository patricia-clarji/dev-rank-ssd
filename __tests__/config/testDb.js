const mongoose = require("mongoose");
const { Sequelize } = require("sequelize");
const path = require("path");

// Test MongoDB connection
const connectTestMongoDB = async () => {
  try {
    const mongoUri = "mongodb://localhost:27017/devrank-test";
    await mongoose.connect(mongoUri);
    console.log("Test MongoDB connected successfully");
  } catch (err) {
    console.error("Test MongoDB connection error:", err.message);
    throw err;
  }
};

// Test SQLite connection
const createTestSequelize = () => {
  const testDbPath = path.join(__dirname, "..", "test-devrank.sqlite");
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: testDbPath,
    logging: false,
  });
  return sequelize;
};

// Disconnect MongoDB
const disconnectMongoDB = async () => {
  await mongoose.disconnect();
};

// Sync test database
const syncTestDb = async (sequelize) => {
  await sequelize.sync({ force: true });
};

// Clear all collections in MongoDB
const clearMongoDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  connectTestMongoDB,
  createTestSequelize,
  disconnectMongoDB,
  syncTestDb,
  clearMongoDB,
};
