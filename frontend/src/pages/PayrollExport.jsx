import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ReportTable from '../components/ReportTable';
import { Download, Upload, History } from 'lucide-react';
import api from '../utils/api';

const PayrollExport = () => {
  const [exports, setExports] = useState([]);
  const [formData, setFormData] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    export_type: 'csv',
    report_type: 'daily',
  });

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    try {
      const response = await api.get('/payroll/history');
      setExports(response.data.exports);
    } catch (error) {
      console.error('Error fetching export history:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.post('/payroll/export', formData);
      
      if (formData.export_type === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payroll_${formData.start_date}_to_${formData.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      fetchExportHistory();
    } catch (error) {
      console.error('Error exporting payroll:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'Export ID' },
    { key: 'export_type', label: 'Type' },
    { key: 'start_date', label: 'Start Date', render: (value) => new Date(value).toLocaleDateString() },
    { key: 'end_date', label: 'End Date', render: (value) => new Date(value).toLocaleDateString() },
    { key: 'record_count', label: 'Records' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      ),
    },
    { key: 'exported_at', label: 'Exported At', render: (value) => new Date(value).toLocaleString() },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Payroll Export</h1>


          <div className="card mb-6">
            <h3 className="text-xl font-bold text-royal-600 mb-4">Export Payroll Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="input-field"
                >
                  <option value="daily">Daily Detailed</option>
                  <option value="weekly">Weekly Summary</option>
                  <option value="monthly">Monthly Summary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Export Type</label>
                <select
                  value={formData.export_type}
                  onChange={(e) => setFormData({ ...formData, export_type: e.target.value })}
                  className="input-field"
                >
                  <option value="csv">CSV Download</option>
                  <option value="api_push">API Push</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleExport} className="btn-primary flex items-center space-x-2">
                {formData.export_type === 'csv' ? (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Push to Payroll API</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <History className="h-5 w-5 text-royal-600" />
            <h3 className="text-xl font-bold text-gray-900">Export History</h3>
          </div>

          <ReportTable columns={columns} data={exports} title="Recent Exports" />
        </div>
      </div>
    </div>
  );
};

export default PayrollExport;
