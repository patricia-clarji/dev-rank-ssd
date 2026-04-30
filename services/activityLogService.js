const ActivityLog = require("../models/sql/ActivityLog");
const {Op} = require("sequelize");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const User = require("../models/mongo/User");
const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");
const { isObjectId, toActionLabel } = require("../utils/stringUtils");


exports.createLog = async ({ userId, action, entity, entityId, metadata }) => {
    return await ActivityLog.create({ userId, action, entity, entityId, metadata });
};


exports.getAllLogs = async (filters = {}) => {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
        where.timestamp = {};

        if (filters.startDate) {
            where.timestamp[Op.gte] = new Date(filters.startDate);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            where.timestamp[Op.lte] = end;
        }
    }

    return await ActivityLog.findAll({
        where,
        order: [["timestamp", "DESC"]]
    });
};

exports.getLogsByUser = async (userId) => {
    return await ActivityLog.findAll({
        where: { userId },
        order: [["timestamp", "DESC"]],
    });
};

exports.getLogsByEntity = async (entity, entityId) => {
    const where = { entity };

    if (entityId) {
        where.entityId = entityId;
    }

    return await ActivityLog.findAll({
        where,
        order: [["timestamp", "DESC"]],
    });
};


exports.deleteLogs = async () => {
    await ActivityLog.destroy({
        where: {},
        truncate: true,
    });

    return { message: "All activity logs have been deleted successfully." }
};


exports.deleteOldLogs = async (beforeDate) => {
    if (!beforeDate) {
        throw new AppError("beforeDate query parameter is required.", 400, ERROR_CODES.VALIDATION);
    }

    const deletedCount = await ActivityLog.destroy({
        where: {
            timestamp: {
                [Op.lt]: new Date(beforeDate),
            },
        },
    });

    return {
        message: "Old activity logs deleted successfully.",
        deletedCount,
    };
};

exports.buildFriendlyActivityLogs = async (logs) => {
  const userIds = new Set();
  const projectIds = new Set();
  const reviewIds = new Set();
  const certificationIds = new Set();

  logs.forEach((log) => {
    if (isObjectId(log.userId)) userIds.add(String(log.userId));

    const entity = String(log.entity || "").toLowerCase();
    if (entity === "project" && isObjectId(log.entityId)) projectIds.add(String(log.entityId));
    if (entity === "review" && isObjectId(log.entityId)) reviewIds.add(String(log.entityId));
    if (entity === "certificationrequest" && isObjectId(log.entityId)) certificationIds.add(String(log.entityId));
    if (entity === "user" && isObjectId(log.entityId)) userIds.add(String(log.entityId));

    const metadata = log.metadata || {};
    if (isObjectId(metadata.projectId)) projectIds.add(String(metadata.projectId));
    if (isObjectId(metadata.followerId)) userIds.add(String(metadata.followerId));
    if (isObjectId(metadata.targetId)) userIds.add(String(metadata.targetId));
  });

  const [users, projects, reviews, certifications] = await Promise.all([
    userIds.size > 0
      ? User.find({ _id: { $in: Array.from(userIds) } }).select("name username")
      : [],
    projectIds.size > 0
      ? Project.find({ _id: { $in: Array.from(projectIds) } }).select("title")
      : [],
    reviewIds.size > 0
      ? Review.find({ _id: { $in: Array.from(reviewIds) } })
          .select("overallRating")
          .populate("project", "title")
      : [],
    certificationIds.size > 0
      ? CertificationRequest.find({ _id: { $in: Array.from(certificationIds) } }).populate("user", "name username")
      : [],
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const projectMap = new Map(projects.map((project) => [String(project._id), project]));
  const reviewMap = new Map(reviews.map((review) => [String(review._id), review]));
  const certMap = new Map(certifications.map((request) => [String(request._id), request]));

  return logs.map((log) => {
    const metadata = log.metadata || {};
    const actorUser = userMap.get(String(log.userId || ""));
    const actorName = metadata.actorName || (actorUser && (actorUser.name || actorUser.username)) || "System";
    const entity = String(log.entity || "").toLowerCase();

    let targetLabel = metadata.title || metadata.name || metadata.target || "";

    if (!targetLabel && entity === "project") {
      const project = projectMap.get(String(log.entityId || metadata.projectId || ""));
      targetLabel = project ? project.title : "Project";
    }

    if (!targetLabel && entity === "review") {
      const review = reviewMap.get(String(log.entityId || ""));
      targetLabel = review ? `Review for ${(review.project && review.project.title) || "Project"}` : "Review";
    }

    if (!targetLabel && entity === "certificationrequest") {
      const request = certMap.get(String(log.entityId || ""));
      targetLabel = request && request.user
        ? `Certification request by ${request.user.name || request.user.username || "user"}`
        : "Certification request";
    }

    if (!targetLabel && entity === "user") {
      const targetUser = userMap.get(String(log.entityId || metadata.targetId || ""));
      targetLabel = targetUser ? (targetUser.name || targetUser.username) : "User";
    }

    const entityLabel = entity === "certificationrequest" 
      ? "Certification" 
      : (entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : "Record");

    const timestamp = log.timestamp || log.createdAt || new Date();

    return {
      ...log,
      actionLabel: toActionLabel(log.action),
      actorName,
      entity: entityLabel,
      targetLabel: targetLabel || entityLabel || "Record",
      detailsText: metadata.adminNotes || metadata.status || metadata.role || "",
      timestamp: new Date(timestamp).toLocaleString(),
      createdAt: new Date(timestamp).toLocaleString(),
    };
  });
}