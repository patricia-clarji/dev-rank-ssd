const ActivityLog = require("../models/sql/ActivityLog");
const {Op} = require("sequelize");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

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