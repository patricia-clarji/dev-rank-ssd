const { appEventBus } = require("../events/eventBus");
const { ACTION_VALUES, ENTITY_VALUES, EVENT_NAMES } = require("../constants/activityLogEnums");

const validateEnumValue = (value, allowedValues, label) => {
  if (!allowedValues.includes(value)) {
    throw new Error(`Invalid activity log ${label}: ${value}`);
  }
};

/**
 * Creates and emits a structured activity log
 * @param {string} userId - The user performing the action
 * @param {string} action - Activity action (from LOG_ACTIONS enum)
 * @param {string} entity - Entity type (from LOG_ENTITIES enum)
 * @param {string} entityId - ID of the entity being acted upon
 * @param {object} metadata - Additional context about the action
 */
const log = (userId, action, entity, entityId = null, metadata = null) => {
  if (!userId) {
    throw new Error("Invalid activity log userId: value is required");
  }

  validateEnumValue(action, ACTION_VALUES, "action");
  validateEnumValue(entity, ENTITY_VALUES, "entity");

  // Emit to event bus (caught by listener in registerEventListeners)
  appEventBus.emit(EVENT_NAMES.ACTIVITY_LOG_CREATED, {
    userId,
    action,
    entity,
    entityId,
    metadata,
  });
};

module.exports = { log };
