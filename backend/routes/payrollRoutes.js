const express = require('express');
const router = express.Router();
const {
  exportPayroll,
  getExportHistory
} = require('../controllers/PayrollController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.post('/export', authMiddleware, isAdmin, exportPayroll);
router.get('/history', authMiddleware, isAdmin, getExportHistory);

module.exports = router;
