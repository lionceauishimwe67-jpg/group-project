import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  School
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
    { path: '/students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
    { path: '/teachers', label: 'Teachers', icon: GraduationCap, roles: ['admin'] },
    { path: '/courses', label: 'Courses', icon: BookOpen, roles: ['admin', 'teacher', 'student'] },
    { path: '/grades', label: 'Grades', icon: Award, roles: ['admin', 'teacher', 'student'] },
    { path: '/users', label: 'Users', icon: UserCircle, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.roles));

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <School className="w-6 h-6 text-white" />
          </div>
          <span className={`font-bold text-xl text-gray-800 whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            SMS
          </span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 rounded-lg hover:bg-gray-100 transition-all ${!isOpen && 'absolute right-2'}`}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Summary */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link to="/profile" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
