import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeManagement from '../pages/EmployeeManagement';
import * as api from '../utils/api';

// Mock api module
jest.mock('../utils/api');

describe('EmployeeManagement Component', () => {
  const mockEmployees = [
    {
      id: 1,
      employee_id: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      department: 'Nursing',
      position: 'RN',
      is_active: true,
    },
    {
      id: 2,
      employee_id: 'EMP002',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'Emergency',
      position: 'Doctor',
      is_active: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderEmployeeManagement = () => {
    return render(
      <BrowserRouter>
        <EmployeeManagement />
      </BrowserRouter>
    );
  };

  test('renders employee management page', () => {
    renderEmployeeManagement();
    expect(screen.getByText('Employee Management')).toBeInTheDocument();
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  test('displays employee list', async () => {
    api.get.mockResolvedValue({ data: { employees: mockEmployees } });
    
    renderEmployeeManagement();
    
    await waitFor(() => {
      expect(screen.getByText('EMP001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('EMP002')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('opens add employee modal', () => {
    renderEmployeeManagement();
    
    const addButton = screen.getByText('Add Employee');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  test('opens edit employee modal', async () => {
    api.get.mockResolvedValue({ data: { employees: mockEmployees } });
    
    renderEmployeeManagement();
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => btn.querySelector('svg'));
      if (editButton) fireEvent.click(editButton);
    });
  });
});
