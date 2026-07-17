const { sequelize } = require('../config/db');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

const convertFaceDataToArray = async () => {
  try {
    console.log('Starting face data migration...');
    
    // Connect to database
    console.log('Attempting to authenticate with database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Find all employees with face_data
    console.log('Querying employees with face data...');
    const employees = await Employee.findAll({
      where: {
        face_data: {
          [Op.ne]: null
        }
      }
    });

    console.log(`Found ${employees.length} employees with face data.`);

    if (employees.length === 0) {
      console.log('No employees with face data found. Migration complete.');
      await sequelize.close();
      process.exit(0);
    }

    let convertedCount = 0;
    let alreadyConvertedCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        const faceData = employee.face_data;
        
        if (!faceData) {
          continue;
        }

        let parsedData;
        try {
          parsedData = JSON.parse(faceData);
        } catch (parseError) {
          console.error(`Failed to parse face data for employee ${employee.employee_id}:`, parseError.message);
          errorCount++;
          continue;
        }

        // Check if already converted (array of arrays)
        if (Array.isArray(parsedData) && parsedData.length > 0 && Array.isArray(parsedData[0])) {
          console.log(`Employee ${employee.employee_id} already has array format. Skipping.`);
          alreadyConvertedCount++;
          continue;
        }

        // Convert single descriptor to array format
        if (Array.isArray(parsedData)) {
          const newArrayFormat = [parsedData];
          await employee.update({ face_data: JSON.stringify(newArrayFormat) });
          console.log(`Converted face data for employee ${employee.employee_id}`);
          convertedCount++;
        } else {
          console.error(`Invalid face data format for employee ${employee.employee_id}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing employee ${employee.employee_id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`- Converted: ${convertedCount}`);
    console.log(`- Already converted: ${alreadyConvertedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${employees.length}`);

    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

// Run migration
convertFaceDataToArray();
