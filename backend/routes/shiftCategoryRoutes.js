const express = require('express');
const router = express.Router();
const {
  getAllShiftCategories,
  getShiftCategoryById,
  createShiftCategory,
  updateShiftCategory,
  deleteShiftCategory
} = require('../controllers/ShiftCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, isAdmin, getAllShiftCategories);
router.get('/:id', authMiddleware, isAdmin, getShiftCategoryById);
router.post('/', authMiddleware, isAdmin, createShiftCategory);
router.put('/:id', authMiddleware, isAdmin, updateShiftCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteShiftCategory);

module.exports = router;
