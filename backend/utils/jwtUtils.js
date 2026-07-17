const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiry }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

module.exports = { generateToken, verifyToken };
