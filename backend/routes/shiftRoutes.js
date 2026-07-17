const express = require('express');
const router = express.Router();
const {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift
} = require('../controllers/ShiftController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, isAdmin, getAllShifts);
router.get('/:id', authMiddleware, isAdmin, getShiftById);
router.post('/', authMiddleware, isAdmin, createShift);
router.put('/:id', authMiddleware, isAdmin, updateShift);
router.delete('/:id', authMiddleware, isAdmin, deleteShift);

module.exports = router;
