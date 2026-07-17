const { sequelize } = require('../config/db');
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');
const Shift = require('../models/Shift');

const clearEmployees = async () => {
  try {
    console.log('Starting employee clearance...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Count employees before deletion
    const employeeCount = await Employee.count();
    console.log(`Found ${employeeCount} employees in database.`);

    if (employeeCount === 0) {
      console.log('No employees to delete. Exiting.');
      await sequelize.close();
      process.exit(0);
    }

    // Count attendance records
    const attendanceCount = await AttendanceRecord.count();
    console.log(`Found ${attendanceCount} attendance records linked to employees.`);

    // Count shifts
    const shiftCount = await Shift.count();
    console.log(`Found ${shiftCount} shifts linked to employees.`);

    // Confirm deletion
    console.log('\nWARNING: This will delete ALL employees, their attendance records, and shifts from the database.');
    console.log('This action cannot be undone.');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to proceed...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete attendance records first (foreign key constraint)
    console.log('\nDeleting attendance records...');
    const deletedAttendance = await AttendanceRecord.destroy({
      where: {}
    });
    console.log(`Deleted ${deletedAttendance} attendance records.`);

    // Delete shifts (foreign key constraint)
    console.log('Deleting shifts...');
    const deletedShifts = await Shift.destroy({
      where: {}
    });
    console.log(`Deleted ${deletedShifts} shifts.`);

    // Delete all employees
    console.log('Deleting employees...');
    const deletedEmployees = await Employee.destroy({
      where: {}
    });
    console.log(`Deleted ${deletedEmployees} employees.`);

    console.log('\nClearance completed successfully.');

    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Employee clearance failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

// Run clearance
clearEmployees();
