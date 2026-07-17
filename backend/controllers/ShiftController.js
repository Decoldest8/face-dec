const Shift = require('../models/Shift');
const ShiftCategory = require('../models/ShiftCategory');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'first_name', 'last_name']
        },
        {
          model: ShiftCategory,
          as: 'shift_category',
          attributes: ['id', 'category_name']
        }
      ],
      order: [['employee_id', 'ASC']]
    });

    res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'first_name', 'last_name']
        },
        {
          model: ShiftCategory,
          as: 'shift_category',
          attributes: ['id', 'category_name']
        }
      ]
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    res.json({ shift });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const createShift = async (req, res) => {
  try {
    const {
      employee_id,
      shift_category_id,
      shift_name,
      start_time,
      end_time,
      days_of_week,
      is_individual_override
    } = req.body;

    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const shift = await Shift.create({
      employee_id,
      shift_category_id: shift_category_id || null,
      shift_name,
      start_time,
      end_time,
      days_of_week,
      is_individual_override: is_individual_override || false
    });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE_SHIFT',
      entity_type: 'Shift',
      entity_id: shift.id,
      ip_address: ip,
      after_state: shift.toJSON()
    });

    res.status(201).json({ shift });
  } catch (error) {
    console.error('Create shift error:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Internal server error.', details: error.message });
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shift_name,
      start_time,
      end_time,
      days_of_week,
      is_individual_override,
      is_active
    } = req.body;

    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const shift = await Shift.findByPk(id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    const beforeState = shift.toJSON();

    await shift.update({
      shift_name: shift_name || shift.shift_name,
      start_time: start_time || shift.start_time,
      end_time: end_time || shift.end_time,
      days_of_week: days_of_week || shift.days_of_week,
      is_individual_override: is_individual_override !== undefined ? is_individual_override : shift.is_individual_override,
      is_active: is_active !== undefined ? is_active : shift.is_active
    });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_SHIFT',
      entity_type: 'Shift',
      entity_id: shift.id,
      ip_address: ip,
      before_state,
      after_state: shift.toJSON()
    });

    res.json({ shift });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const shift = await Shift.findByPk(id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    const beforeState = shift.toJSON();

    await shift.destroy();

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE_SHIFT',
      entity_type: 'Shift',
      entity_id: id,
      ip_address: ip,
      before_state
    });

    res.json({ message: 'Shift deleted successfully.' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift
};
