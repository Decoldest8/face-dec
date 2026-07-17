const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BiometricDevice = sequelize.define('BiometricDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  device_type: {
    type: DataTypes.ENUM('face_recognition', 'rfid'),
    allowNull: false,
    defaultValue: 'face_recognition'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4370
  },
  serial_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'biometric_devices',
  indexes: [
    { fields: ['device_type'] },
    { fields: ['is_active'] }
  ]
});

module.exports = BiometricDevice;
