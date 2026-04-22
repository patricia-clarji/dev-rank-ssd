require("dotenv").config({ path: ".env.test" });
const {
  connectTestMongoDB,
  createTestSequelize,
  clearMongoDB,
  disconnectMongoDB,
} = require("./config/testDb");

let sequelize;

beforeAll(async () => {
  try {
    // Connect to test MongoDB
    await connectTestMongoDB();

    // Initialize SQLite in memory for CI (or file for local)
    sequelize = createTestSequelize();

    // Make sure all tables exist before any test
    await sequelize.sync({ force: true }); // <-- this ensures tables are created

    global.testSequelize = sequelize;
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

beforeEach(async () => {
  // Clear MongoDB as before
  try {
    await clearMongoDB();
  } catch (error) {
    console.warn("Error clearing MongoDB:", error);
  }

  // Clear SQLite tables safely
  try {
    const models = sequelize.models;
    for (const modelName in models) {
      const model = models[modelName];
      await model.destroy({ truncate: true, force: true }); // safe for empty tables
    }
  } catch (err) {
    console.warn("Error clearing SQLite tables:", err);
  }
});

afterAll(async () => {
  try {
    await disconnectMongoDB();
    if (sequelize) await sequelize.close();
  } catch (error) {
    console.error("Test cleanup failed:", error);
  }
});

module.exports = {
  sequelize,
};