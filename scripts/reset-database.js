const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server.');

    await connection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
    console.log(`Database '${process.env.DB_NAME}' dropped.`);

    await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${process.env.DB_NAME}' created.`);

    await connection.end();
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetDatabase();
