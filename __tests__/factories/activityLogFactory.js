/**
 * Activity Log Factory
 * Creates test ActivityLog instances with sensible defaults
 */

const ActivityLog = require("../../models/sql/ActivityLog");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../../constants/activityLogEnums");

/**
 * Default activity log data
 */
const DEFAULT_ACTIVITY_LOG = {
  userId: "user123",
  action: LOG_ACTIONS.CREATE_PROJECT,
  entity: LOG_ENTITIES.PROJECT,
  entityId: "proj123",
  timestamp: new Date(),
  details: "Test log",
};

/**
 * Creates a single test activity log
 * @param {Object} overrides - Property overrides for the default log
 * @returns {Promise<Object>} Created activity log
 */
async function createActivityLog(overrides = {}) {
  const data = { ...DEFAULT_ACTIVITY_LOG, ...overrides };
  return ActivityLog.create(data);
}

/**
 * Creates multiple test activity logs
 * @param {number} count - Number of logs to create
 * @param {Function} overrideFn - Function to generate unique overrides per log
 * @returns {Promise<Array>} Array of created activity logs
 */
async function createActivityLogs(count = 1, overrideFn) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const overrides = overrideFn ? overrideFn(i) : { userId: `user${i}`, entityId: `proj${i}` };
    logs.push(await createActivityLog(overrides));
  }
  return logs;
}

/**
 * Creates an old activity log (useful for deletion tests)
 * @param {number} daysOld - Days in the past
 * @returns {Promise<Object>} Created old activity log
 */
async function createOldActivityLog(daysOld = 10) {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - daysOld);
  return createActivityLog({ timestamp: oldDate, details: "Old log" });
}

module.exports = {
  createActivityLog,
  createActivityLogs,
  createOldActivityLog,
  DEFAULT_ACTIVITY_LOG,
};
