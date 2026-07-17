const request = require('supertest');
const app = require('../server');
const HRUser = require('../models/HRUser');
const { hashPassword } = require('../utils/bcryptUtils');
const { sequelize } = require('../config/db');

describe('Middleware Tests', () => {
  let authToken;
  let sysAdminToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const passwordHash = await hashPassword('TestPassword123!');
    
    await HRUser.create({
      username: 'hruser',
      email: 'hr@example.com',
      password_hash: passwordHash,
      role: 'HR_ADMIN',
      is_active: true
    });

    await HRUser.create({
      username: 'sysadmin',
      email: 'sysadmin@example.com',
      password_hash: passwordHash,
      role: 'SYS_ADMIN',
      is_active: true
    });

    const hrLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'hruser', password: 'TestPassword123!' });
    authToken = hrLoginResponse.body.token;

    const sysLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'sysadmin', password: 'TestPassword123!' });
    sysAdminToken = sysLoginResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Auth Middleware', () => {
    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });

    test('should deny access with expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJIUl9BRE1JTiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Role Middleware', () => {
    test('should allow HR_ADMIN access to admin routes', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('should allow SYS_ADMIN access to admin routes', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${sysAdminToken}`);

      expect(response.status).toBe(200);
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/employees');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limit', async () => {
      const responses = [];
      for (let i = 0; i < 10; i++) {
        responses.push(await request(app).get('/health'));
      }

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should have rate limit headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Helmet Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
