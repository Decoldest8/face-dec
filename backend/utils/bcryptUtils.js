const bcrypt = require('bcryptjs');
const env = require('../config/env');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, env.security.bcryptRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
