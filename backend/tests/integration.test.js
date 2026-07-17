const request = require('supertest');
const app = require('../server');
const Employee = require('../models/Employee');
const ShiftCategory = require('../models/ShiftCategory');
const Shift = require('../models/Shift');
const AttendanceRecord = require('../models/AttendanceRecord');
const HRUser = require('../models/HRUser');
const { hashPassword } = require('../utils/bcryptUtils');
const { sequelize } = require('../config/db');

describe('Integration Tests', () => {
  let authToken;
  let employee;
  let shiftCategory;

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

    shiftCategory = await ShiftCategory.create({
      category_name: 'Morning Shift',
      description: '6 AM to 2 PM shift',
      start_time: '06:00:00',
      end_time: '14:00:00',
      days_of_week: '1,2,3,4,5',
      grace_period_minutes: 15
    });

    employee = await Employee.create({
      employee_id: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      department: 'Nursing',
      position: 'RN',
      is_active: true,
      shift_category_id: shiftCategory.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AttendanceRecord.destroy({ where: {} });
    await Shift.destroy({ where: {} });
  });

  describe('Employee Management Flow', () => {
    test('should create, read, update, and delete employee', async () => {
      const createResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employee_id: 'EMP002',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          department: 'Emergency',
          position: 'Doctor'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.employee).toHaveProperty('employee_id', 'EMP002');

      const readResponse = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.employees.length).toBeGreaterThan(1);

      const updateResponse = await request(app)
        .put(`/api/employees/${createResponse.body.employee.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ department: 'Surgery' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.employee.department).toBe('Surgery');

      const deleteResponse = await request(app)
        .delete(`/api/employees/${createResponse.body.employee.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Shift Management Flow', () => {
    test('should create and assign shift to employee', async () => {
      const shiftResponse = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employee_id: employee.id,
          shift_category_id: shiftCategory.id,
          shift_name: 'Custom Morning',
          start_time: '07:00:00',
          end_time: '15:00:00',
          days_of_week: '1,2,3,4,5',
          is_individual_override: true
        });

      expect(shiftResponse.status).toBe(201);
      expect(shiftResponse.body.shift).toHaveProperty('is_individual_override', true);
    });
  });

  describe('Attendance Flow', () => {
    test('should complete full attendance cycle', async () => {
      const clockInResponse = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(clockInResponse.status).toBe(201);
      expect(clockInResponse.body.attendanceRecord).toHaveProperty('clock_in');

      const clockOutResponse = await request(app)
        .post('/api/attendance/clock-out')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(clockOutResponse.status).toBe(200);
      expect(clockOutResponse.body.attendanceRecord).toHaveProperty('clock_out');
    });

    test('should detect late arrival', async () => {
      const lateShiftCategory = await ShiftCategory.create({
        category_name: 'Late Test Shift',
        start_time: '06:00:00',
        end_time: '14:00:00',
        days_of_week: '1,2,3,4,5',
        grace_period_minutes: 5
      });

      await employee.update({ shift_category_id: lateShiftCategory.id });

      const clockInResponse = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employee_id: 'EMP001',
          method: 'fingerprint'
        });

      expect(clockInResponse.status).toBe(201);
    });
  });

  describe('Reporting Flow', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_out: new Date(),
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint'
      });
    });

    test('should generate daily report', async () => {
      const response = await request(app)
        .get('/api/attendance/reports/daily')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.records).toBeInstanceOf(Array);
    });

    test('should generate weekly report', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/attendance/reports/weekly')
        .query({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.records).toBeInstanceOf(Array);
    });
  });

  describe('Payroll Export Flow', () => {
    beforeEach(async () => {
      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: new Date(),
        clock_out: new Date(),
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint'
      });
    });

    test('should export payroll as CSV', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .post('/api/payroll/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          export_type: 'csv'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    test('should get export history', async () => {
      const response = await request(app)
        .get('/api/payroll/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exports');
    });
  });

  describe('Authentication Flow', () => {
    test('should login, access protected route, and logout', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(meResponse.status).toBe(200);

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(logoutResponse.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});
