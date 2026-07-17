import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ShiftForm from '../components/ShiftForm';
import ReportTable from '../components/ReportTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../utils/api';

const ShiftConfig = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftCategories, setShiftCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shiftsRes, employeesRes, categoriesRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/employees'),
        api.get('/shift-categories'),
      ]);
      setShifts(shiftsRes.data.shifts);
      setEmployees(employeesRes.data.employees);
      setShiftCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAdd = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await api.delete(`/shifts/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting shift:', error);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingShift) {
        await api.put(`/shifts/${editingShift.id}`, formData);
      } else {
        await api.post('/shifts', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  const columns = [
    { key: 'employee_id', label: 'Employee ID', render: (_, row) => row.employee?.employee_id },
    { key: 'employee_name', label: 'Employee Name', render: (_, row) => `${row.employee?.first_name} ${row.employee?.last_name}` },
    { key: 'shift_name', label: 'Shift Name' },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    { key: 'days_of_week', label: 'Days' },
    {
      key: 'is_individual_override',
      label: 'Override',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="text-royal-600 hover:text-royal-800">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Shift Configuration</h1>
            <button onClick={handleAdd} className="btn-primary flex items-center space-x-2">

              <Plus className="h-5 w-5" />
              <span>Add Shift</span>
            </button>
          </div>

          <ReportTable columns={columns} data={shifts} title="All Shifts" />

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-4 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-royal-600 mb-4">

                  {editingShift ? 'Edit Shift' : 'Add Shift'}
                </h2>
                <ShiftForm
                  onSubmit={handleSubmit}
                  initialData={editingShift || {}}
                  employees={employees}
                  shiftCategories={shiftCategories}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftConfig;
