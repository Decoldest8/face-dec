const Employee = require('../models/Employee');
const ShiftCategory = require('../models/ShiftCategory');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: ShiftCategory,
          as: 'shift_category',
          attributes: ['id', 'category_name', 'start_time', 'end_time']
        }
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: ShiftCategory,
          as: 'shift_category',
          attributes: ['id', 'category_name', 'start_time', 'end_time']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      hire_date,
      shift_category_id
    } = req.body;

    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const existingEmployee = await Employee.findOne({
      where: {
        [Op.or]: [
          { employee_id },
          { email }
        ]
      }
    });

    if (existingEmployee) {
      return res.status(409).json({ 
        error: 'Employee ID or email already exists.' 
      });
    }

    const employee = await Employee.create({
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      hire_date: hire_date || new Date(),
      shift_category_id
    });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE_EMPLOYEE',
      entity_type: 'Employee',
      entity_id: employee.id,
      ip_address: ip,
      after_state: employee.toJSON()
    });

    res.status(201).json({ employee });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      shift_category_id,
      is_active
    } = req.body;

    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const beforeState = employee.toJSON();

    await employee.update({
      first_name: first_name || employee.first_name,
      last_name: last_name || employee.last_name,
      email: email || employee.email,
      phone: phone !== undefined ? phone : employee.phone,
      department: department !== undefined ? department : employee.department,
      position: position !== undefined ? position : employee.position,
      shift_category_id: shift_category_id !== undefined ? shift_category_id : employee.shift_category_id,
      is_active: is_active !== undefined ? is_active : employee.is_active
    });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_EMPLOYEE',
      entity_type: 'Employee',
      entity_id: employee.id,
      ip_address: ip,
      before_state,
      after_state: employee.toJSON()
    });

    res.json({ employee });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const beforeState = employee.toJSON();

    await employee.destroy();

    // Try to create audit log, but don't fail if it errors
    try {
      await AuditLog.create({
        user_id: req.user?.id || null,
        username: req.user?.username || 'SYSTEM',
        action: 'DELETE_EMPLOYEE',
        entity_type: 'Employee',
        entity_id: id,
        ip_address: ip,
        before_state
      });
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
    }

    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const registerFace = async (req, res) => {
  try {
    const { id } = req.params;
    const { face_data } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    if (!face_data) {
      return res.status(400).json({ error: 'Face data is required.' });
    }

    // Validate face_data is an array of descriptors
    let parsedFaceData;
    try {
      parsedFaceData = JSON.parse(face_data);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid face data format. Must be valid JSON.' });
    }

    if (!Array.isArray(parsedFaceData)) {
      return res.status(400).json({ error: 'Face data must be an array of descriptors.' });
    }

    if (parsedFaceData.length !== 3) {
      return res.status(400).json({ error: 'Face data must contain exactly 3 descriptors.' });
    }

    // Validate each descriptor is an array of numbers
    for (let i = 0; i < parsedFaceData.length; i++) {
      if (!Array.isArray(parsedFaceData[i])) {
        return res.status(400).json({ error: `Descriptor ${i + 1} must be an array.` });
      }
      if (parsedFaceData[i].length === 0) {
        return res.status(400).json({ error: `Descriptor ${i + 1} cannot be empty.` });
      }
      for (const val of parsedFaceData[i]) {
        if (typeof val !== 'number') {
          return res.status(400).json({ error: `Descriptor ${i + 1} must contain only numbers.` });
        }
      }
    }

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const beforeState = employee.toJSON();

    await employee.update({ face_data });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'REGISTER_FACE',
      entity_type: 'Employee',
      entity_id: employee.id,
      ip_address: ip,
      before_state,
      after_state: employee.toJSON()
    });

    res.json({ employee, message: 'Face registered successfully.' });
  } catch (error) {
    console.error('Register face error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateFace = async (req, res) => {
  try {
    const { id } = req.params;
    const { face_data } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    if (!face_data) {
      return res.status(400).json({ error: 'Face data is required.' });
    }

    // Validate face_data is an array of descriptors
    let parsedFaceData;
    try {
      parsedFaceData = JSON.parse(face_data);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid face data format. Must be valid JSON.' });
    }

    if (!Array.isArray(parsedFaceData)) {
      return res.status(400).json({ error: 'Face data must be an array of descriptors.' });
    }

    if (parsedFaceData.length !== 3) {
      return res.status(400).json({ error: 'Face data must contain exactly 3 descriptors.' });
    }

    // Validate each descriptor is an array of numbers
    for (let i = 0; i < parsedFaceData.length; i++) {
      if (!Array.isArray(parsedFaceData[i])) {
        return res.status(400).json({ error: `Descriptor ${i + 1} must be an array.` });
      }
      if (parsedFaceData[i].length === 0) {
        return res.status(400).json({ error: `Descriptor ${i + 1} cannot be empty.` });
      }
      for (const val of parsedFaceData[i]) {
        if (typeof val !== 'number') {
          return res.status(400).json({ error: `Descriptor ${i + 1} must contain only numbers.` });
        }
      }
    }

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const beforeState = employee.toJSON();

    await employee.update({ face_data });

    try {
      await AuditLog.create({
        user_id: req.user.id,
        username: req.user.username,
        action: 'UPDATE_FACE',
        entity_type: 'Employee',
        entity_id: employee.id,
        ip_address: ip,
        before_state,
        after_state: employee.toJSON()
      });
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
    }

    res.json({ employee, message: 'Face updated successfully.' });
  } catch (error) {
    console.error('Update face error:', error);
    res.status(500).json({ error: 'Internal server error.', details: error.message });
  }
};

const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({
      where: { employee_id: employeeId },
      include: [
        {
          model: ShiftCategory,
          as: 'shift_category',
          attributes: ['id', 'category_name', 'start_time', 'end_time']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (!employee.is_active) {
      return res.status(403).json({ error: 'Employee is inactive.' });
    }

    if (!employee.face_data) {
      return res.status(400).json({ error: 'Face not registered for this employee.' });
    }

    // Validate face_data format
    try {
      const parsedFaceData = JSON.parse(employee.face_data);
      if (!Array.isArray(parsedFaceData) || parsedFaceData.length === 0) {
        return res.status(400).json({ error: 'Invalid face data format.' });
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid face data format.' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee by employee ID error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  registerFace,
  updateFace,
  getEmployeeByEmployeeId
};
