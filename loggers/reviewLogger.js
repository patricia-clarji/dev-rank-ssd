const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logReviewCreated = (userId, reviewId, projectId, overallRating, status) => {
  log(userId, LOG_ACTIONS.CREATE_REVIEW, LOG_ENTITIES.REVIEW, reviewId, { projectId, overallRating, status });
};

const logReviewUpdated = (userId, reviewId, projectId, status) => {
  log(userId, LOG_ACTIONS.UPDATE_REVIEW, LOG_ENTITIES.REVIEW, reviewId, { projectId, status });
};

const logReviewDeleted = (userId, reviewId, projectId) => {
  log(userId, LOG_ACTIONS.DELETE_REVIEW, LOG_ENTITIES.REVIEW, reviewId, { projectId });
};

module.exports = {
  logReviewCreated,
  logReviewUpdated,
  logReviewDeleted,
};
