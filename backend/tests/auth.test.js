const request = require('supertest');
const app = require('../server');
const HRUser = require('../models/HRUser');
const { hashPassword } = require('../utils/bcryptUtils');
const { sequelize } = require('../config/db');

describe('Auth Controller Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await HRUser.destroy({ where: {} });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'HR_ADMIN');
    });

    test('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'TestPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials.');
    });

    test('should fail with invalid password', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials.');
    });

    test('should fail with inactive account', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Account is inactive.');
    });

    test('should lock account after 5 failed attempts', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: true
      });

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'testuser', password: 'WrongPassword123!' });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Account locked');
    });

    test('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully.');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user with valid token', async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      await HRUser.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'HR_ADMIN',
        is_active: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'TestPassword123!' });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
