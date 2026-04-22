const { DataTypes } = require("sequelize");
const sequelize = require("../../config/sqlite");
const { ACTION_VALUES, ENTITY_VALUES } = require("../../constants/activityLogEnums");

const ActivityLog = sequelize.define("ActivityLog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.ENUM(...ACTION_VALUES),
    allowNull: false,
    validate: {
      isIn: [ACTION_VALUES],
    },
  },
  entity: {
    type: DataTypes.ENUM(...ENTITY_VALUES),
    allowNull: false,
    validate: {
      isIn: [ENTITY_VALUES],
    },
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = ActivityLog;