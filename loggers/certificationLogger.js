const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logCertificationApplied = (userId, requestId, techExpertise) => {
  log(userId, LOG_ACTIONS.APPLY_CERTIFICATION, LOG_ENTITIES.CERTIFICATION_REQUEST, requestId, { techExpertise });
};

const logCertificationApproved = (userId, requestId, adminNotes) => {
  log(userId, LOG_ACTIONS.APPROVE_CERTIFICATION, LOG_ENTITIES.CERTIFICATION_REQUEST, requestId, { adminNotes });
};

const logCertificationRejected = (userId, requestId, adminNotes) => {
  log(userId, LOG_ACTIONS.REJECT_CERTIFICATION, LOG_ENTITIES.CERTIFICATION_REQUEST, requestId, { adminNotes });
};

module.exports = {
  logCertificationApplied,
  logCertificationApproved,
  logCertificationRejected,
};
