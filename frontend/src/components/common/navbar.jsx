import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Hooks/useauth';
import { Sprout, LogOut, User } from 'lucide-react';
import LanguageSelector from './languageselector';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Sprout className="text-primary-600 w-8 h-8" />
            <span className="text-2xl font-bold text-gray-900">AgroShakti</span>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
              <User size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;