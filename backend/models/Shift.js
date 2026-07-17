const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  shift_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'shift_categories',
      key: 'id'
    }
  },
  shift_name: {
    type: DataTypes.STRING(50),
    allowNull: false
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
  is_individual_override: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'If true, this shift overrides the category shift'
  },
  effective_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'shifts',
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['shift_category_id'] },
    { fields: ['is_active'] },
    { fields: ['effective_date'] }
  ]
});

module.exports = Shift;
