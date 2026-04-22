const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logProjectCreated = (userId, projectId, title, status) => {
  log(userId, LOG_ACTIONS.CREATE_PROJECT, LOG_ENTITIES.PROJECT, projectId, { title, status });
};

const logProjectUpdated = (userId, projectId, title, status) => {
  log(userId, LOG_ACTIONS.UPDATE_PROJECT, LOG_ENTITIES.PROJECT, projectId, { title, status });
};

const logProjectDeleted = (userId, projectId, title) => {
  log(userId, LOG_ACTIONS.DELETE_PROJECT, LOG_ENTITIES.PROJECT, projectId, { title });
};

module.exports = {
  logProjectCreated,
  logProjectUpdated,
  logProjectDeleted,
};
