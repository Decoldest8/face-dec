const HRUser = require('../models/HRUser');
const AuditLog = require('../models/AuditLog');
const { hashPassword, comparePassword } = require('../utils/bcryptUtils');
const { generateToken } = require('../utils/jwtUtils');
const env = require('../config/env');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'];

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await HRUser.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive.' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(403).json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes.` 
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      user.failed_login_attempts += 1;

      if (user.failed_login_attempts >= env.security.maxLoginAttempts) {
        user.locked_until = new Date(Date.now() + env.security.lockoutDuration * 60000);
        await user.save();

        await AuditLog.create({
          user_id: user.id,
          username: user.username,
          action: 'ACCOUNT_LOCKED',
          entity_type: 'HRUser',
          entity_id: user.id,
          ip_address: ip,
          user_agent: userAgent,
          before_state: { failed_attempts: user.failed_login_attempts - 1 },
          after_state: { locked_until: user.locked_until }
        });

        return res.status(403).json({ 
          error: `Account locked due to too many failed attempts. Try again in ${env.security.lockoutDuration} minutes.` 
        });
      }

      await user.save();

      await AuditLog.create({
        user_id: user.id,
        username: user.username,
        action: 'FAILED_LOGIN',
        entity_type: 'HRUser',
        entity_id: user.id,
        ip_address: ip,
        user_agent: userAgent,
        before_state: { failed_attempts: user.failed_login_attempts - 1 },
        after_state: { failed_attempts: user.failed_login_attempts }
      });

      const remainingAttempts = env.security.maxLoginAttempts - user.failed_login_attempts;
      return res.status(401).json({ 
        error: 'Invalid credentials.',
        remainingAttempts 
      });
    }

    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login = new Date();
    await user.save();

    const token = generateToken(user.id, user.role);

    await AuditLog.create({
      user_id: user.id,
      username: user.username,
      action: 'SUCCESSFUL_LOGIN',
      entity_type: 'HRUser',
      entity_id: user.id,
      ip_address: ip,
      user_agent: userAgent
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const logout = async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'];

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'LOGOUT',
      entity_type: 'HRUser',
      entity_id: req.user.id,
      ip_address: ip,
      user_agent: userAgent
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        last_login: req.user.last_login
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { login, logout, getMe };
