import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeToday: 0,
    presentToday: 0,
    lateToday: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [employeesRes, attendanceRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance/reports/daily'),
      ]);

      const employees = employeesRes.data.employees;
      const records = attendanceRes.data.records;

      const today = new Date().toISOString().split('T')[0];
      const todayRecords = records.filter(
        (record) => record.clock_in.split('T')[0] === today
      );

      setStats({
        totalEmployees: employees.length,
        activeToday: employees.filter((e) => e.is_active).length,
        presentToday: todayRecords.length,
        lateToday: todayRecords.filter((r) => r.is_late).length,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-royal-500',
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Late Today',
      value: stats.lateToday,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat) => (
              <div key={stat.title} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="card">
              <h3 className="text-lg font-bold text-royal-600 mb-3">Quick Actions</h3>
              <div className="space-y-2">

                <button 
                  className="w-full btn-primary text-left"
                  onClick={() => navigate('/biometric-terminal')}
                >
                  Clock In Employee
                </button>
                <button 
                  className="w-full btn-secondary text-left"
                  onClick={() => navigate('/biometric-terminal')}
                >
                  Clock Out Employee
                </button>
                <button 
                  className="w-full btn-primary text-left"
                  onClick={() => navigate('/attendance-reports')}
                >
                  View Today's Attendance
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-royal-600 mb-3">System Status</h3>
              <div className="space-y-2">

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Database</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Biometric Devices</span>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Auto-Logout Engine</span>
                  <span className="text-green-600 font-medium">Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
