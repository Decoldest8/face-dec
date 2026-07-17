const ShiftCategory = require('../models/ShiftCategory');
const AuditLog = require('../models/AuditLog');

const getAllShiftCategories = async (req, res) => {
  try {
    const categories = await ShiftCategory.findAll();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching shift categories:', error);
    res.status(500).json({ error: 'Failed to fetch shift categories' });
  }
};

const getShiftCategoryById = async (req, res) => {
  try {
    const category = await ShiftCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Shift category not found' });
    }
    res.json({ category });
  } catch (error) {
    console.error('Error fetching shift category:', error);
    res.status(500).json({ error: 'Failed to fetch shift category' });
  }
};

const createShiftCategory = async (req, res) => {
  try {
    const { category_name, description, start_time, end_time, days_of_week, grace_period_minutes } = req.body;
    
    const category = await ShiftCategory.create({
      category_name,
      description,
      start_time,
      end_time,
      days_of_week,
      grace_period_minutes
    });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE',
      entity_type: 'ShiftCategory',
      entity_id: category.id,
      ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1',
      before_state: null,
      after_state: category.toJSON()
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating shift category:', error);
    res.status(500).json({ error: 'Failed to create shift category' });
  }
};

const updateShiftCategory = async (req, res) => {
  try {
    const category = await ShiftCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Shift category not found' });
    }

    const beforeState = category.toJSON();
    await category.update(req.body);
    const afterState = category.toJSON();

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE',
      entity_type: 'ShiftCategory',
      entity_id: category.id,
      ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1',
      before_state: beforeState,
      after_state: afterState
    });

    res.json({ category });
  } catch (error) {
    console.error('Error updating shift category:', error);
    res.status(500).json({ error: 'Failed to update shift category' });
  }
};

const deleteShiftCategory = async (req, res) => {
  try {
    const category = await ShiftCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Shift category not found' });
    }

    const beforeState = category.toJSON();
    await category.destroy();

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE',
      entity_type: 'ShiftCategory',
      entity_id: category.id,
      ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1',
      before_state: beforeState,
      after_state: null
    });

    res.json({ message: 'Shift category deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift category:', error);
    res.status(500).json({ error: 'Failed to delete shift category' });
  }
};

module.exports = {
  getAllShiftCategories,
  getShiftCategoryById,
  createShiftCategory,
  updateShiftCategory,
  deleteShiftCategory
};
