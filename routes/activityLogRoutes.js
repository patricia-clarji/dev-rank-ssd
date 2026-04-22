const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const {validateGetAllLogsQuery} = require("../middleware/validators/activityLogValidators");

// GET /api/logs - Get all activity logs
router.get("/", validateGetAllLogsQuery, activityLogController.getAllLogs);

// GET /api/logs/user/:userId - Get logs by user id
router.get("/user/:userId", activityLogController.getLogsByUser);

// GET /api/logs/entity/:entity - Get logs by entity type
router.get("/entity/:entity", activityLogController.getLogsByEntity);

// GET /api/logs/entity/:entity/:entityId - Get logs for a specific entity record
router.get("/entity/:entity/:entityId", activityLogController.getLogsByEntity);

// DELETE /api/logs/old?beforeDate=xxxx-xx-xx - Delete old logs
router.delete("/old", activityLogController.deleteOldLogs);

// DELETE /api/logs - Delete all logs
router.delete("/", activityLogController.deleteLogs);

module.exports = router;