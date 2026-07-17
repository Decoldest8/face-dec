const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const PayrollExport = require('../models/PayrollExport');
const AuditLog = require('../models/AuditLog');
const axios = require('axios');
const { sequelize } = require('../config/db');

const exportPayroll = async (req, res) => {
  try {
    const { start_date, end_date, export_type, report_type } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    if (!start_date || !end_date || !export_type) {
      return res.status(400).json({ 
        error: 'Start date, end date, and export type are required.' 
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.findAll({
      where: {
        clock_in: {
          [sequelize.Op.gte]: startDate,
          [sequelize.Op.lte]: endDate
        },
        clock_out: { [sequelize.Op.ne]: null }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'first_name', 'last_name', 'department', 'position', 'hourly_rate']
        }
      ],
      order: [['clock_in', 'ASC']]
    });

    const payrollExport = await PayrollExport.create({
      export_type,
      start_date: startDate,
      end_date: endDate,
      record_count: records.length,
      status: 'completed',
      exported_by: req.user.id
    });

    if (export_type === 'csv') {
      let csv;
      let fileName;

      if (report_type === 'weekly' || report_type === 'monthly') {
        // Aggregate data by employee for weekly/monthly reports
        const employeeStats = {};
        
        records.forEach(record => {
          const empId = record.employee.employee_id;
          if (!employeeStats[empId]) {
            employeeStats[empId] = {
              employee_id: empId,
              first_name: record.employee.first_name,
              last_name: record.employee.last_name,
              department: record.employee.department || '',
              position: record.employee.position || '',
              hourly_rate: record.employee.hourly_rate || 15.00,
              total_hours: 0,
              total_earned: 0,
              days_worked: 0,
              clock_ins: []
            };
          }
          
          const hoursWorked = record.hours_worked || (record.clock_out 
            ? ((new Date(record.clock_out) - new Date(record.clock_in)) / 3600000)
            : 0);
          
          employeeStats[empId].total_hours += hoursWorked;
          employeeStats[empId].total_earned += hoursWorked * employeeStats[empId].hourly_rate;
          employeeStats[empId].days_worked += 1;
          employeeStats[empId].clock_ins.push(new Date(record.clock_in).toLocaleString());
        });

        csv = 'Employee ID,First Name,Last Name,Department,Position,Hourly Rate,Total Hours Worked,Total Earned,Days Worked,Average Hours/Day\n';

        Object.values(employeeStats).forEach(emp => {
          const avgHours = emp.days_worked > 0 ? (emp.total_hours / emp.days_worked).toFixed(2) : '0.00';
          
          const escapeField = (field) => {
            const str = String(field);
            return str.includes(',') ? `"${str}"` : str;
          };
          
          csv += `${escapeField(emp.employee_id)},${escapeField(emp.first_name)},${escapeField(emp.last_name)},${escapeField(emp.department)},${escapeField(emp.position)},${emp.hourly_rate},${emp.total_hours.toFixed(2)},${emp.total_earned.toFixed(2)},${emp.days_worked},${avgHours}\n`;
        });

        fileName = `payroll_${report_type}_${start_date}_to_${end_date}.csv`;
      } else {
        // Daily detailed report
        csv = 'Employee ID,First Name,Last Name,Department,Position,Clock In,Clock Out,Hours Worked,Hourly Rate,Amount Earned\n';

        records.forEach(record => {
          const hoursWorked = record.hours_worked || (record.clock_out 
            ? ((new Date(record.clock_out) - new Date(record.clock_in)) / 3600000).toFixed(2)
            : '0.00');
          const hourlyRate = record.employee.hourly_rate || 15.00;
          const amountEarned = record.amount_earned || (hoursWorked * hourlyRate).toFixed(2);
          
          // Format dates for cleaner CSV
          const clockIn = new Date(record.clock_in).toLocaleString();
          const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleString() : 'N/A';
          
          // Escape fields with commas
          const escapeField = (field) => {
            const str = String(field);
            return str.includes(',') ? `"${str}"` : str;
          };
          
          csv += `${escapeField(record.employee.employee_id)},${escapeField(record.employee.first_name)},${escapeField(record.employee.last_name)},${escapeField(record.employee.department || '')},${escapeField(record.employee.position || '')},${escapeField(clockIn)},${escapeField(clockOut)},${hoursWorked},${hourlyRate},${amountEarned}\n`;
        });

        fileName = `payroll_${start_date}_to_${end_date}.csv`;
      }

      const filePath = `./exports/${fileName}`;

      const fs = require('fs');
      if (!fs.existsSync('./exports')) {
        fs.mkdirSync('./exports', { recursive: true });
      }
      fs.writeFileSync(filePath, csv);

      await payrollExport.update({ file_path: filePath });

      await AuditLog.create({
        user_id: req.user.id,
        username: req.user.username,
        action: 'EXPORT_PAYROLL_CSV',
        entity_type: 'PayrollExport',
        entity_id: payrollExport.id,
        ip_address: ip,
        after_state: { record_count: records.length, file_path: filePath, report_type }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(csv);
    } else if (export_type === 'api_push') {
      const payrollData = records.map(record => {
        const hoursWorked = record.hours_worked || ((new Date(record.clock_out) - new Date(record.clock_in)) / 3600000).toFixed(2);
        const hourlyRate = record.employee.hourly_rate || 15.00;
        const amountEarned = record.amount_earned || (hoursWorked * hourlyRate).toFixed(2);
        return {
          employee_id: record.employee.employee_id,
          first_name: record.employee.first_name,
          last_name: record.employee.last_name,
          department: record.employee.department,
          position: record.employee.position,
          clock_in: record.clock_in,
          clock_out: record.clock_out,
          hours_worked: hoursWorked,
          hourly_rate: hourlyRate,
          amount_earned: amountEarned
        };
      });

      const apiEndpoint = process.env.PAYROLL_API_ENDPOINT || 'https://api.payroll-system.com/v1/import';

      try {
        const apiResponse = await axios.post(apiEndpoint, {
          export_id: payrollExport.id,
          start_date,
          end_date,
          records: payrollData
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PAYROLL_API_KEY}`
          }
        });

        await payrollExport.update({
          api_endpoint: apiEndpoint,
          api_response: apiResponse.data
        });

        await AuditLog.create({
          user_id: req.user.id,
          username: req.user.username,
          action: 'EXPORT_PAYROLL_API',
          entity_type: 'PayrollExport',
          entity_id: payrollExport.id,
          ip_address: ip,
          after_state: { 
            record_count: records.length,
            api_response: apiResponse.data 
          }
        });

        res.json({ 
          message: 'Payroll data pushed successfully.',
          export_id: payrollExport.id,
          api_response: apiResponse.data
        });
      } catch (apiError) {
        await payrollExport.update({
          status: 'failed',
          error_message: apiError.message
        });

        await AuditLog.create({
          user_id: req.user.id,
          username: req.user.username,
          action: 'EXPORT_PAYROLL_API_FAILED',
          entity_type: 'PayrollExport',
          entity_id: payrollExport.id,
          ip_address: ip,
          after_state: { 
            error: apiError.message 
          }
        });

        res.status(500).json({ 
          error: 'Failed to push payroll data to API.',
          details: apiError.message 
        });
      }
    } else {
      res.status(400).json({ error: 'Invalid export type. Use "csv" or "api_push".' });
    }
  } catch (error) {
    console.error('Export payroll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getExportHistory = async (req, res) => {
  try {
    const exports = await PayrollExport.findAll({
      include: [
        {
          model: require('../models/HRUser'),
          as: 'exporter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['exported_at', 'DESC']],
      limit: 50
    });

    res.json({ exports });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  exportPayroll,
  getExportHistory
};
