const request = require('supertest');
const app = require('../server');
const Employee = require('../models/Employee');
const ShiftCategory = require('../models/ShiftCategory');
const AttendanceRecord = require('../models/AttendanceRecord');
const HRUser = require('../models/HRUser');
const { hashPassword } = require('../utils/bcryptUtils');
const { sequelize } = require('../config/db');

describe('Attendance Controller Tests', () => {
  let authToken;
  let employee;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const passwordHash = await hashPassword('TestPassword123!');
    const user = await HRUser.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'HR_ADMIN',
      is_active: true
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'TestPassword123!' });
    authToken = loginResponse.body.token;

    employee = await Employee.create({
      employee_id: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      department: 'Nursing',
      position: 'RN',
      is_active: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AttendanceRecord.destroy({ where: {} });
  });

  describe('POST /api/attendance/clock-in', () => {
    test('should clock in successfully', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('attendanceRecord');
      expect(response.body.attendanceRecord).toHaveProperty('employee_id', employee.id);
      expect(response.body.attendanceRecord).toHaveProperty('clock_in_method', 'fingerprint');
    });

    test('should fail with duplicate clock-in on same day', async () => {
      await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already clocked in');
    });

    test('should fail with non-existent employee', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP999',
          method: 'fingerprint'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Employee not found.');
    });

    test('should fail with inactive employee', async () => {
      await employee.update({ is_active: false });

      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Employee is inactive.');

      await employee.update({ is_active: true });
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({ employee_id: 'EMP001' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/attendance/clock-out', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_in_method: 'fingerprint'
      });
    });

    test('should clock out successfully', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-out')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('attendanceRecord');
      expect(response.body.attendanceRecord).toHaveProperty('clock_out');
      expect(response.body.attendanceRecord).toHaveProperty('clock_out_method', 'fingerprint');
    });

    test('should fail with no active clock-in', async () => {
      await AttendanceRecord.destroy({ where: {} });

      const response = await request(app)
        .post('/api/attendance/clock-out')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No active clock-in');
    });

    test('should fail with non-existent employee', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-out')
        .send({
          employee_id: 'EMP999',
          method: 'fingerprint'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Employee not found.');
    });
  });

  describe('GET /api/attendance/reports/daily', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_out: new Date(),
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint'
      });
    });

    test('should get daily report successfully', async () => {
      const response = await request(app)
        .get('/api/attendance/reports/daily')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(response.body.records).toBeInstanceOf(Array);
      expect(response.body.records.length).toBeGreaterThan(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/attendance/reports/daily');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/reports/weekly', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_out: new Date(),
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint'
      });
    });

    test('should get weekly report successfully', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/attendance/reports/weekly')
        .query({ start_date: startDate.toISOString().split('T')[0], end_date: endDate.toISOString().split('T')[0] })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(response.body.records).toBeInstanceOf(Array);
    });

    test('should fail without date parameters', async () => {
      const response = await request(app)
        .get('/api/attendance/reports/weekly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/attendance/reports/weekly');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/export/csv', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_out: new Date(),
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint'
      });
    });

    test('should export CSV successfully', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/attendance/export/csv')
        .query({ start_date: startDate.toISOString().split('T')[0], end_date: endDate.toISOString().split('T')[0] })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/attendance/export/csv');

      expect(response.status).toBe(401);
    });
  });
});
