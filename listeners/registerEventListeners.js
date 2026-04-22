const { appEventBus } = require("../events/eventBus");
const { EVENT_NAMES } = require("../constants/activityLogEnums");
const activityLogService = require("../services/activityLogService");

let isRegistered = false;

const handleActivityLogCreated = async (payload) => {
  try {
    await activityLogService.createLog(payload);
  } catch (error) {
    console.error("Failed to persist activity log event:", {
      message: error.message,
      action: payload?.action,
      entity: payload?.entity,
      entityId: payload?.entityId,
      userId: payload?.userId,
    });
  }
};

const registerEventListeners = () => {
  if (isRegistered) {
    return;
  }

  appEventBus.on(EVENT_NAMES.ACTIVITY_LOG_CREATED, handleActivityLogCreated);

  isRegistered = true;
};

const unregisterEventListeners = () => {
  if (!isRegistered) {
    return;
  }

  appEventBus.off(EVENT_NAMES.ACTIVITY_LOG_CREATED, handleActivityLogCreated);
  isRegistered = false;
};

module.exports = {
  registerEventListeners,
  unregisterEventListeners,
};