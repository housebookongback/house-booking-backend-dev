const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminActionLog = sequelize.define('AdminActionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'system'
  },
  actionType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_action_logs',
  timestamps: true
});

module.exports = AdminActionLog; 