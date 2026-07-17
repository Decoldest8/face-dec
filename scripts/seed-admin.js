const bcrypt = require('bcryptjs');
const { sequelize } = require('../backend/config/db');
const HRUser = require('../backend/models/HRUser');

require('dotenv').config();

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Check if admin already exists
    const existingAdmin = await HRUser.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      console.log('Username: admin');
      console.log('Password: admin123');
      await sequelize.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await HRUser.create({
      username: 'admin',
      email: 'admin@vitalityhospital.com',
      password_hash: hashedPassword,
      role: 'HR_ADMIN',
      is_active: true,
      failed_login_attempts: 0,
      is_locked: false,
      locked_until: null
    });

    console.log('Admin user created successfully.');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: HR_ADMIN');

    await sequelize.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
