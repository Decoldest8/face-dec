const { autoLogoutEngine } = require('../utils/cronScheduler');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const { sequelize } = require('../config/db');

describe('Cron Scheduler Tests', () => {
  let employee;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

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

  describe('Auto-logout Engine', () => {
    test('should auto-logout unclosed records from previous days', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: yesterday,
        clock_in_method: 'fingerprint',
        clock_out: null,
        auto_logged_out: false
      });

      await autoLogoutEngine();

      const record = await AttendanceRecord.findOne({
        where: { employee_id: employee.id }
      });

      expect(record.clock_out).not.toBeNull();
      expect(record.auto_logged_out).toBe(true);
      expect(record.clock_out_method).toBe('auto');
    });

    test('should not auto-logout records from today', async () => {
      const today = new Date();
      today.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: today,
        clock_in_method: 'fingerprint',
        clock_out: null,
        auto_logged_out: false
      });

      await autoLogoutEngine();

      const record = await AttendanceRecord.findOne({
        where: { employee_id: employee.id }
      });

      expect(record.clock_out).toBeNull();
      expect(record.auto_logged_out).toBe(false);
    });

    test('should not auto-logout already closed records', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: yesterday,
        clock_out: yesterday,
        clock_in_method: 'fingerprint',
        clock_out_method: 'fingerprint',
        auto_logged_out: false
      });

      await autoLogoutEngine();

      const record = await AttendanceRecord.findOne({
        where: { employee_id: employee.id }
      });

      expect(record.clock_out_method).toBe('fingerprint');
      expect(record.auto_logged_out).toBe(false);
    });

    test('should not auto-logout already auto-logged out records', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: yesterday,
        clock_out: yesterday,
        clock_in_method: 'fingerprint',
        clock_out_method: 'auto',
        auto_logged_out: true
      });

      await autoLogoutEngine();

      const record = await AttendanceRecord.findOne({
        where: { employee_id: employee.id }
      });

      expect(record.clock_out_method).toBe('auto');
      expect(record.auto_logged_out).toBe(true);
    });

    test('should handle multiple unclosed records', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(9, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: twoDaysAgo,
        clock_in_method: 'fingerprint',
        clock_out: null,
        auto_logged_out: false
      });

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: yesterday,
        clock_in_method: 'fingerprint',
        clock_out: null,
        auto_logged_out: false
      });

      await autoLogoutEngine();

      const records = await AttendanceRecord.findAll({
        where: { employee_id: employee.id }
      });

      expect(records.length).toBe(2);
      records.forEach(record => {
        expect(record.clock_out).not.toBeNull();
        expect(record.auto_logged_out).toBe(true);
      });
    });

    test('should set auto-logout time to end of day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await AttendanceRecord.create({
        employee_id: employee.id,
        clock_in: yesterday,
        clock_in_method: 'fingerprint',
        clock_out: null,
        auto_logged_out: false
      });

      await autoLogoutEngine();

      const record = await AttendanceRecord.findOne({
        where: { employee_id: employee.id }
      });

      const clockOutDate = new Date(record.clock_out);
      expect(clockOutDate.getHours()).toBe(23);
      expect(clockOutDate.getMinutes()).toBe(59);
      expect(clockOutDate.getSeconds()).toBe(59);
    });

    test('should handle empty attendance records', async () => {
      await expect(autoLogoutEngine()).resolves.not.toThrow();
    });

    test('should be resilient to database errors', async () => {
      jest.spyOn(AttendanceRecord, 'findAll').mockRejectedValueOnce(new Error('DB Error'));

      await expect(autoLogoutEngine()).resolves.not.toThrow();

      AttendanceRecord.findAll.mockRestore();
    });
  });
});
