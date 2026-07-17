import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import ShiftConfig from './pages/ShiftConfig';
import AttendanceReports from './pages/AttendanceReports';
import PayrollExport from './pages/PayrollExport';
import BiometricTerminal from './pages/BiometricTerminal';

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <ShiftConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-reports"
          element={
            <ProtectedRoute>
              <AttendanceReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <PayrollExport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/biometric-terminal"
          element={
            <ProtectedRoute>
              <BiometricTerminal />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
