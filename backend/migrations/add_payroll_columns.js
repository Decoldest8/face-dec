const { sequelize } = require('../config/db');

async function columnExists(tableName, columnName) {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'vitality_biometric' 
      AND TABLE_NAME = '${tableName}' 
      AND COLUMN_NAME = '${columnName}'
    `);
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

async function addPayrollColumns() {
  try {
    console.log('Starting payroll columns migration...');
    
    // Add hourly_rate column to employees table
    if (!await columnExists('employees', 'hourly_rate')) {
      await sequelize.query(`
        ALTER TABLE employees 
        ADD COLUMN hourly_rate DECIMAL(10, 2) DEFAULT 15.00 
        COMMENT 'Hourly pay rate in USD'
      `);
      console.log('✓ Added hourly_rate column to employees table');
    } else {
      console.log('✓ hourly_rate column already exists in employees table');
    }
    
    // Add hours_worked column to attendance_records table
    if (!await columnExists('attendance_records', 'hours_worked')) {
      await sequelize.query(`
        ALTER TABLE attendance_records 
        ADD COLUMN hours_worked DECIMAL(10, 2) 
        COMMENT 'Total hours worked in this session'
      `);
      console.log('✓ Added hours_worked column to attendance_records table');
    } else {
      console.log('✓ hours_worked column already exists in attendance_records table');
    }
    
    // Add amount_earned column to attendance_records table
    if (!await columnExists('attendance_records', 'amount_earned')) {
      await sequelize.query(`
        ALTER TABLE attendance_records 
        ADD COLUMN amount_earned DECIMAL(10, 2) 
        COMMENT 'Total amount earned in USD for this session'
      `);
      console.log('✓ Added amount_earned column to attendance_records table');
    } else {
      console.log('✓ amount_earned column already exists in attendance_records table');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addPayrollColumns();
