const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const ShiftCategory = require('../models/ShiftCategory');
const BiometricDevice = require('../models/BiometricDevice');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

const clockIn = async (req, res) => {
  try {
    const { employee_id, biometric_device_id, method } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    if (!employee_id || !method) {
      return res.status(400).json({ error: 'Employee ID and method are required.' });
    }

    // Trim whitespace from employee_id
    const trimmedEmployeeId = employee_id.trim();

    const employee = await Employee.findOne({ where: { employee_id: trimmedEmployeeId } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (!employee.is_active) {
      return res.status(403).json({ error: 'Employee is inactive.' });
    }

    const today = new Date().toLocaleDateString('en-US', { timeZone: 'UTC' });
    const existingRecord = await AttendanceRecord.findOne({
      where: {
        employee_id: employee.id,
        clock_in: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        },
        clock_out: null
      }
    });

    if (existingRecord) {
      return res.status(409).json({ 
        error: 'Employee already clocked in today. Please clock out first.' 
      });
    }

    let shift = null;
    if (employee.shift_category_id) {
      shift = await Shift.findOne({
        where: {
          employee_id: employee.id,
          is_individual_override: true,
          is_active: true
        },
        include: [{ model: ShiftCategory, as: 'shift_category' }]
      });

      if (!shift) {
        const shiftCategory = await ShiftCategory.findByPk(employee.shift_category_id);
        if (shiftCategory) {
          shift = { shift_category: shiftCategory };
        }
      }
    }

    const clockInTime = new Date();
    let isLate = false;

    if (shift && shift.shift_category) {
      const shiftStartTime = new Date();
      const [hours, minutes] = shift.shift_category.start_time.split(':');
      shiftStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const gracePeriod = shift.shift_category.grace_period_minutes || 15;
      const allowedTime = new Date(shiftStartTime.getTime() + gracePeriod * 60000);

      if (clockInTime > allowedTime) {
        isLate = true;
      }
    }

    const attendanceRecord = await AttendanceRecord.create({
      employee_id: employee.id,
      biometric_device_id,
      clock_in: clockInTime,
      clock_in_method: method,
      shift_id: shift?.id || null,
      is_late: isLate,
      ip_address: ip
    });

    await AuditLog.create({
      user_id: req.user?.id || null,
      username: req.user?.username || 'SYSTEM',
      action: 'CLOCK_IN',
      entity_type: 'AttendanceRecord',
      entity_id: attendanceRecord.id,
      ip_address: ip,
      after_state: attendanceRecord.toJSON()
    });

    res.status(201).json({ 
      attendanceRecord,
      isLate 
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const clockOut = async (req, res) => {
  try {
    const { employee_id, method } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    if (!employee_id || !method) {
      return res.status(400).json({ error: 'Employee ID and method are required.' });
    }

    // Trim whitespace from employee_id
    const trimmedEmployeeId = employee_id.trim();

    const employee = await Employee.findOne({ where: { employee_id: trimmedEmployeeId } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        employee_id: employee.id,
        clock_out: null
      },
      order: [['clock_in', 'DESC']]
    });

    if (!attendanceRecord) {
      return res.status(404).json({ 
        error: 'No active clock-in record found for this employee.' 
      });
    }

    const clockOutTime = new Date();
    let isEarlyDeparture = false;

    if (attendanceRecord.shift_id) {
      const shift = await Shift.findByPk(attendanceRecord.shift_id, {
        include: [{ model: ShiftCategory, as: 'shift_category' }]
      });

      if (shift && shift.shift_category) {
        const shiftEndTime = new Date();
        const [hours, minutes] = shift.shift_category.end_time.split(':');
        shiftEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (clockOutTime < shiftEndTime) {
          isEarlyDeparture = true;
        }
      }
    }

    // Calculate hours worked and amount earned
    const clockInTime = new Date(attendanceRecord.clock_in);
    const hoursWorked = (clockOutTime - clockInTime) / 3600000; // Convert milliseconds to hours
    const hourlyRate = employee.hourly_rate || 15.00; // Default to $15/hour if not set
    const amountEarned = hoursWorked * hourlyRate;

    await attendanceRecord.update({
      clock_out: clockOutTime,
      clock_out_method: method,
      is_early_departure: isEarlyDeparture,
      hours_worked: hoursWorked,
      amount_earned: amountEarned
    });

    await AuditLog.create({
      user_id: req.user?.id || null,
      username: req.user?.username || 'SYSTEM',
      action: 'CLOCK_OUT',
      entity_type: 'AttendanceRecord',
      entity_id: attendanceRecord.id,
      ip_address: ip,
      before_state: { clock_out: null },
      after_state: attendanceRecord.toJSON()
    });

    res.json({ 
      message: 'Clock out successful.',
      attendanceRecord,
      isEarlyDeparture,
      hoursWorked: hoursWorked.toFixed(2),
      amountEarned: amountEarned.toFixed(2)
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.findAll({
      where: {
        clock_in: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name', 'department']
        },
        {
          model: Shift,
          as: 'shift',
          include: [{ model: ShiftCategory, as: 'shift_category' }]
        }
      ],
      order: [['clock_in', 'ASC']]
    });

    res.json({ 
      date: reportDate.toISOString().split('T')[0],
      records 
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getWeeklyReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.findAll({
      where: {
        clock_in: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name', 'department']
        },
        {
          model: Shift,
          as: 'shift',
          include: [{ model: ShiftCategory, as: 'shift_category' }]
        }
      ],
      order: [['clock_in', 'ASC']]
    });

    res.json({ 
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      records 
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.findAll({
      where: {
        clock_in: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        },
        clock_out: { [Op.ne]: null }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name', 'department']
        }
      ],
      order: [['clock_in', 'ASC']]
    });

    let csv = 'Employee ID,First Name,Last Name,Department,Clock In,Clock Out,Method,Late,Early Departure\n';

    records.forEach(record => {
      csv += `${record.employee.employee_id},${record.employee.first_name},${record.employee.last_name},${record.employee.department || ''},${record.clock_in},${record.clock_out},${record.clock_in_method},${record.is_late},${record.is_early_departure}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${start_date}_to_${end_date}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getDailyReport,
  getWeeklyReport,
  exportCSV
};
