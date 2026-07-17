import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileText, 
  Download, 
  Fingerprint 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees', icon: Users, label: 'Employee Management' },
    { path: '/shifts', icon: Clock, label: 'Shift Configuration' },
    { path: '/attendance-reports', icon: FileText, label: 'Attendance Reports' },
    { path: '/payroll', icon: Download, label: 'Payroll Export' },
    { path: '/biometric-terminal', icon: Fingerprint, label: 'Biometric Terminal' },
  ];

  return (
    <aside className="w-16 sm:w-56 bg-white shadow-lg min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-royal-600 mb-4 hidden sm:block">Menu</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${
                  isActive ? '' : ''
                } sm:space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-royal-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
