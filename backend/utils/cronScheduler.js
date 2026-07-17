const cron = require('node-cron');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/cron-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/cron-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

const autoLogoutEngine = async () => {
  try {
    logger.info('Auto-logout engine started');

    const today = new Date().toLocaleDateString('en-US', { timeZone: 'UTC' });
    
    const unclosedRecords = await AttendanceRecord.findAll({
      where: {
        clock_out: null,
        auto_logged_out: false
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name']
        }
      ]
    });

    logger.info(`Found ${unclosedRecords.length} unclosed attendance records`);

    for (const record of unclosedRecords) {
      try {
        const recordDate = new Date(record.clock_in).toLocaleDateString('en-US', { timeZone: 'UTC' });
        
        if (recordDate === today) {
          logger.info(`Skipping record ${record.id} - clocked in today`);
          continue;
        }

        const clockInDate = new Date(record.clock_in);
        const autoLogoutTime = new Date(clockInDate);
        autoLogoutTime.setHours(23, 59, 59, 999);

        await record.update({
          clock_out: autoLogoutTime,
          clock_out_method: 'auto',
          auto_logged_out: true
        });

        logger.info(`Auto-logged out employee ${record.employee.employee_id} (${record.employee.first_name} ${record.employee.last_name}) for record ${record.id}`);

        await AuditLog.create({
          user_id: 0,
          username: 'SYSTEM',
          action: 'AUTO_LOGOUT',
          entity_type: 'AttendanceRecord',
          entity_id: record.id,
          ip_address: '127.0.0.1',
          before_state: { clock_out: null, auto_logged_out: false },
          after_state: { clock_out: autoLogoutTime, auto_logged_out: true }
        });
      } catch (recordError) {
        logger.error(`Error processing record ${record.id}:`, recordError);
      }
    }

    logger.info('Auto-logout engine completed successfully');
  } catch (error) {
    logger.error('Auto-logout engine error:', error);
  }
};

const startCronScheduler = () => {
  cron.schedule('* * * * *', autoLogoutEngine);
  logger.info('Cron scheduler started - running every minute');
};

module.exports = { startCronScheduler, autoLogoutEngine };
