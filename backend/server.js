// Express server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize, testConnection } = require('./config/db');
const env = require('./config/env');
const { startCronScheduler } = require('./utils/cronScheduler');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const shiftCategoryRoutes = require('./routes/shiftCategoryRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

// Serve frontend static files in production
if (env.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: env.nodeEnv === 'production' ? true : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:58160'],
  credentials: true
}));

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/shift-categories', shiftCategoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes in production
if (env.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      res.status(404).json({ error: 'API route not found.' });
    }
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const initializeDatabase = async () => {
  try {
    await testConnection();
    
    await sequelize.sync();
    console.log('Database synchronized successfully.');
    
    const Employee = require('./models/Employee');
    const ShiftCategory = require('./models/ShiftCategory');
    const Shift = require('./models/Shift');
    const AttendanceRecord = require('./models/AttendanceRecord');
    const HRUser = require('./models/HRUser');
    const AuditLog = require('./models/AuditLog');
    const PayrollExport = require('./models/PayrollExport');
    const BiometricDevice = require('./models/BiometricDevice');

    ShiftCategory.hasMany(Employee, { foreignKey: 'shift_category_id', as: 'employees' });
    Employee.belongsTo(ShiftCategory, { foreignKey: 'shift_category_id', as: 'shift_category' });

    Employee.hasMany(Shift, { foreignKey: 'employee_id', as: 'shifts' });
    Shift.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    ShiftCategory.hasMany(Shift, { foreignKey: 'shift_category_id', as: 'shifts' });
    Shift.belongsTo(ShiftCategory, { foreignKey: 'shift_category_id', as: 'shift_category' });

    Employee.hasMany(AttendanceRecord, { foreignKey: 'employee_id', as: 'attendance_records' });
    AttendanceRecord.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    BiometricDevice.hasMany(AttendanceRecord, { foreignKey: 'biometric_device_id', as: 'attendance_records' });
    AttendanceRecord.belongsTo(BiometricDevice, { foreignKey: 'biometric_device_id', as: 'biometric_device' });

    Shift.hasMany(AttendanceRecord, { foreignKey: 'shift_id', as: 'attendance_records' });
    AttendanceRecord.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift' });

    HRUser.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
    AuditLog.belongsTo(HRUser, { foreignKey: 'user_id', as: 'user' });

    HRUser.hasMany(PayrollExport, { foreignKey: 'exported_by', as: 'exports' });
    PayrollExport.belongsTo(HRUser, { foreignKey: 'exported_by', as: 'exporter' });

    console.log('Database associations established successfully.');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await initializeDatabase();
    
    startCronScheduler();
    
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Frontend URL: ${env.frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
