import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportTable from '../components/ReportTable';
import { Download, Calendar } from 'lucide-react';
import api from '../utils/api';

const AttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [reportType, date, startDate, endDate]);

  const fetchReport = async () => {
    try {
      let response;
      if (reportType === 'daily') {
        response = await api.get('/attendance/reports/daily', { params: { date } });
      } else {
        response = await api.get('/attendance/reports/weekly', {
          params: { start_date: startDate, end_date: endDate },
        });
      }
      setRecords(response.data.records);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/attendance/export/csv', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const columns = [
    { key: 'employee_id', label: 'Employee ID', render: (_, row) => row.employee?.employee_id },
    { key: 'employee_name', label: 'Employee Name', render: (_, row) => `${row.employee?.first_name} ${row.employee?.last_name}` },
    { key: 'department', label: 'Department', render: (_, row) => row.employee?.department },
    { key: 'clock_in', label: 'Clock In', render: (value) => new Date(value).toLocaleString() },
    { key: 'clock_out', label: 'Clock Out', render: (value) => (value ? new Date(value).toLocaleString() : '-') },
    { key: 'clock_in_method', label: 'Method' },
    {
      key: 'is_late',
      label: 'Late',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_early_departure',
      label: 'Early',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'hours_worked',
      label: 'Hours Worked',
      render: (value) => value ? parseFloat(value).toFixed(2) : '-'
    },
    {
      key: 'amount_earned',
      label: 'Amount Earned',
      render: (value) => value ? `$${parseFloat(value).toFixed(2)}` : '-'
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Reports</h1>


          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-royal-600" />
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="input-field"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                </select>
              </div>

              {reportType === 'daily' ? (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}

              <button onClick={handleExportCSV} className="btn-secondary flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <ReportTable
            columns={columns}
            data={records}
            title={reportType === 'daily' ? `Daily Report - ${date}` : `Weekly Report - ${startDate} to ${endDate}`}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
