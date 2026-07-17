import React, { useState } from 'react';

const ShiftForm = ({ onSubmit, initialData = {}, employees, shiftCategories }) => {
  const [formData, setFormData] = useState({
    employee_id: initialData.employee_id || '',
    shift_category_id: initialData.shift_category_id || '',
    shift_name: initialData.shift_name || '',
    start_time: initialData.start_time || '',
    end_time: initialData.end_time || '',
    days_of_week: initialData.days_of_week || '1,2,3,4,5',
    is_individual_override: initialData.is_individual_override || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee
        </label>
        <select
          name="employee_id"
          value={formData.employee_id}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.employee_id} - {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shift Category
        </label>
        <select
          name="shift_category_id"
          value={formData.shift_category_id}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">Select Category (Optional)</option>
          {shiftCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.category_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shift Name
        </label>
        <input
          type="text"
          name="shift_name"
          value={formData.shift_name}
          onChange={handleChange}
          className="input-field"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Days of Week (comma-separated: 1=Mon, 2=Tue, etc.)
        </label>
        <input
          type="text"
          name="days_of_week"
          value={formData.days_of_week}
          onChange={handleChange}
          className="input-field"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_individual_override"
          checked={formData.is_individual_override}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Individual Override (overrides category shift)
        </label>
      </div>

      <div className="flex space-x-3">
        <button type="submit" className="btn-primary">
          Save Shift
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ShiftForm;
