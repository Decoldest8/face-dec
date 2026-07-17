const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
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
  biometric_device_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'biometric_devices',
      key: 'id'
    }
  },
  clock_in: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  clock_out: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clock_in_method: {
    type: DataTypes.ENUM('face_recognition', 'rfid', 'webauthn', 'manual'),
    allowNull: false,
    defaultValue: 'face_recognition'
  },
  clock_out_method: {
    type: DataTypes.ENUM('face_recognition', 'rfid', 'webauthn', 'manual', 'auto'),
    allowNull: true
  },
  shift_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'shifts',
      key: 'id'
    }
  },
  is_late: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_early_departure: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  auto_logged_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  hours_worked: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Total hours worked in this session'
  },
  amount_earned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Total amount earned in USD for this session'
  }
}, {
  tableName: 'attendance_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['biometric_device_id'] },
    { fields: ['clock_in'] },
    { fields: ['clock_out'] },
    { fields: ['shift_id'] },
    { fields: ['auto_logged_out'] }
  ]
});

module.exports = AttendanceRecord;
