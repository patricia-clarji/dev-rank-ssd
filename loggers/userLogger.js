const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logUserRegistered = (userId, name, role) => {
  log(userId, LOG_ACTIONS.REGISTER_USER, LOG_ENTITIES.USER, userId, { name, role });
};

const logUserUpdated = (userId, name) => {
  log(userId, LOG_ACTIONS.UPDATE_USER, LOG_ENTITIES.USER, userId, { name });
};

const logUserRoleChanged = (actorId, targetUserId, oldRole, newRole) => {
  log(actorId, LOG_ACTIONS.UPDATE_USER, LOG_ENTITIES.USER, targetUserId, {
    oldRole,
    newRole,
  });
};

const logUserDeleted = (userId, name) => {
  log(userId, LOG_ACTIONS.DELETE_USER, LOG_ENTITIES.USER, userId, { name });
};

const logUserSkillsAdded = (userId, skillsAdded, count) => {
  log(userId, LOG_ACTIONS.ADD_USER_SKILLS, LOG_ENTITIES.USER, userId, { skillsAdded, count });
};

const logUserSkillRemoved = (userId, removedSkill, count) => {
  log(userId, LOG_ACTIONS.REMOVE_USER_SKILL, LOG_ENTITIES.USER, userId, { removedSkill, count });
};

const logUserSkillsRemoved = (userId, skillsRemoved, count) => {
  log(userId, LOG_ACTIONS.REMOVE_USER_SKILLS, LOG_ENTITIES.USER, userId, { skillsRemoved, count });
};



module.exports = {
  logUserRegistered,
  logUserUpdated,
  logUserRoleChanged,
  logUserDeleted,
  logUserSkillsAdded,
  logUserSkillRemoved,
  logUserSkillsRemoved,
};
