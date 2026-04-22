const activityLogService = require("../services/activityLogService");
const asyncHandler = require("../middleware/asyncHandler");

// Get all activity logs
exports.getAllLogs = asyncHandler(async (req, res) => {
  const logs = await activityLogService.getAllLogs(req.query);
  res.status(200).json(logs);
});

// Get logs by user id
exports.getLogsByUser = asyncHandler(async (req, res) => {
  const logs = await activityLogService.getLogsByUser(req.params.userId);
  res.status(200).json(logs);
});

// Get logs by entity and optional entity id
exports.getLogsByEntity = asyncHandler(async (req, res) => {
  const logs = await activityLogService.getLogsByEntity(req.params.entity, req.params.entityId);
  res.status(200).json(logs);
});

// Delete all logs
exports.deleteLogs = asyncHandler(async (req, res) => {
  const result = await activityLogService.deleteLogs();
  res.status(200).json(result);
});

//Delete old logs
exports.deleteOldLogs = asyncHandler(async (req, res) => {
  const result = await activityLogService.deleteOldLogs(req.query.beforeDate);
  res.status(200).json(result);
});

