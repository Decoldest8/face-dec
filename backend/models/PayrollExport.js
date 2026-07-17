const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PayrollExport = sequelize.define('PayrollExport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  export_type: {
    type: DataTypes.ENUM('csv', 'api_push'),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  record_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  api_endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  api_response: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exported_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'hr_users',
      key: 'id'
    }
  },
  exported_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payroll_exports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['export_type'] },
    { fields: ['status'] },
    { fields: ['exported_by'] },
    { fields: ['exported_at'] }
  ]
});

module.exports = PayrollExport;
