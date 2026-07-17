const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Unique employee identifier'
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hire_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  face_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Face recognition descriptor data (JSON string)'
  },
  rfid_card: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'RFID card number'
  },
  shift_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'shift_categories',
      key: 'id'
    }
  },
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 15.00,
    comment: 'Hourly pay rate in USD'
  }
}, {
  tableName: 'employees'
});

module.exports = Employee;
