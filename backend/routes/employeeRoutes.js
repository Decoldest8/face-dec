const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  registerFace,
  updateFace,
  getEmployeeByEmployeeId
} = require('../controllers/EmployeeController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, isAdmin, getAllEmployees);
router.get('/:id', authMiddleware, isAdmin, getEmployeeById);
router.get('/by-employee-id/:employeeId', authMiddleware, getEmployeeByEmployeeId);
router.post('/', authMiddleware, isAdmin, createEmployee);
router.put('/:id', authMiddleware, isAdmin, updateEmployee);
router.delete('/:id', authMiddleware, isAdmin, deleteEmployee);
router.post('/:id/register-face', authMiddleware, isAdmin, registerFace);
router.put('/:id/update-face', authMiddleware, isAdmin, updateFace);

module.exports = router;
