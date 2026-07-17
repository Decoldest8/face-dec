const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'vitality_biometric',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expiry: process.env.JWT_EXPIRY || '8h'
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15
  },
  
  biometric: {
    zkTecoIp: process.env.ZKTECO_IP || '192.168.1.100',
    zkTecoPort: parseInt(process.env.ZKTECO_PORT) || 4370
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};

module.exports = env;
