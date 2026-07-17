import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import * as api from '../utils/api';

// Mock api module
jest.mock('../utils/api');

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  test('renders dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders statistics cards', () => {
    renderDashboard();
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('Active Today')).toBeInTheDocument();
    expect(screen.getByText('Present Today')).toBeInTheDocument();
    expect(screen.getByText('Late Today')).toBeInTheDocument();
  });

  test('renders quick actions section', () => {
    renderDashboard();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Clock In Employee')).toBeInTheDocument();
    expect(screen.getByText('Clock Out Employee')).toBeInTheDocument();
  });

  test('renders system status section', () => {
    renderDashboard();
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Biometric Devices')).toBeInTheDocument();
    expect(screen.getByText('Auto-Logout Engine')).toBeInTheDocument();
  });
});
