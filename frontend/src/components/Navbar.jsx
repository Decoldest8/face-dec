import React from 'react';
import { LogOut, User, Building } from 'lucide-react';
import { logout, getCurrentUser } from '../utils/auth';

const Navbar = () => {
  const user = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <nav className="bg-royal-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Building className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">Vitality Hospital</span>
            <span className="ml-3 text-royal-200 text-sm">Biometric Log System</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs bg-royal-500 px-2 py-1 rounded">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-royal-700 hover:bg-royal-800 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
