const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logSkillCreated = (userId, skillId, name, category) => {
  log(userId, LOG_ACTIONS.CREATE_SKILL, LOG_ENTITIES.SKILL, skillId, { name, category });
};

const logSkillUpdated = (userId, skillId, name, category) => {
  log(userId, LOG_ACTIONS.UPDATE_SKILL, LOG_ENTITIES.SKILL, skillId, { name, category });
};

const logSkillDeleted = (userId, skillId, name, category) => {
  log(userId, LOG_ACTIONS.DELETE_SKILL, LOG_ENTITIES.SKILL, skillId, { name, category });
};

module.exports = {
  logSkillCreated,
  logSkillUpdated,
  logSkillDeleted,
};