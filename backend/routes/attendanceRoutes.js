const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getDailyReport,
  getWeeklyReport,
  exportCSV
} = require('../controllers/AttendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/reports/daily', authMiddleware, isAdmin, getDailyReport);
router.get('/reports/weekly', authMiddleware, isAdmin, getWeeklyReport);
router.get('/export/csv', authMiddleware, isAdmin, exportCSV);

module.exports = router;
