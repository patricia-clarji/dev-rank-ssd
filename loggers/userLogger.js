const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logUserRegistered = (userId, name, role) => {
  log(userId, LOG_ACTIONS.REGISTER_USER, LOG_ENTITIES.USER, userId, { name, role });
};

const logUserUpdated = (userId, name) => {
  log(userId, LOG_ACTIONS.UPDATE_USER, LOG_ENTITIES.USER, userId, { name });
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

const logUserFollowed = (followerId, targetId) => {
  log(followerId, LOG_ACTIONS.FOLLOW_USER, LOG_ENTITIES.USER, targetId, { followerId, targetId });
};

const logUserUnfollowed = (followerId, targetId) => {
  log(followerId, LOG_ACTIONS.UNFOLLOW_USER, LOG_ENTITIES.USER, targetId, { followerId, targetId });
};

module.exports = {
  logUserRegistered,
  logUserUpdated,
  logUserDeleted,
  logUserSkillsAdded,
  logUserSkillRemoved,
  logUserSkillsRemoved,
  logUserFollowed,
  logUserUnfollowed,
};
