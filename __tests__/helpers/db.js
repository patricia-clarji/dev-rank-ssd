/**
 * Database Helper
 * Centralizes database cleanup and connection utilities for tests
 */

/**
 * Clears a single MongoDB collection
 * @param {Model} mongooseModel - Mongoose model
 * @returns {Promise<void>}
 */
async function clearMongoCollection(mongooseModel) {
  await mongooseModel.deleteMany({});
}

/**
 * Clears multiple MongoDB collections
 * @param {Array<Model>} mongooseModels - Array of Mongoose models
 * @returns {Promise<void>}
 */
async function clearMongoCollections(...mongooseModels) {
  await Promise.all(mongooseModels.map(clearMongoCollection));
}

/**
 * Clears SQL table(s)
 * @param {Model|Array<Model>} models - Sequelize model or array of models
 * @returns {Promise<void>}
 */
async function clearSQLTable(model) {
  await model.destroy({ where: {} });
}

/**
 * Clears multiple SQL tables
 * @param {Array<Model>} models - Array of Sequelize models
 * @returns {Promise<void>}
 */
async function clearSQLTables(...models) {
  await Promise.all(models.map(clearSQLTable));
}

module.exports = {
  clearMongoCollection,
  clearMongoCollections,
  clearSQLTable,
  clearSQLTables,
};
