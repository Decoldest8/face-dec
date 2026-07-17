const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShiftCategory = sequelize.define('ShiftCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  days_of_week: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Comma-separated days (e.g., "1,2,3,4,5")'
  },
  grace_period_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'Minutes allowed after start time before marked late'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'shift_categories',
  indexes: [
    { unique: true, fields: ['category_name'] },
    { fields: ['is_active'] }
  ]
});

module.exports = ShiftCategory;
