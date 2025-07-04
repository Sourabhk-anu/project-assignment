import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Building, 
  UserCheck, 
  Package, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      module: 'dashboard',
      action: 'read'
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      module: 'users',
      action: 'read'
    },
    {
      name: 'Roles',
      href: '/roles',
      icon: Shield,
      module: 'roles',
      action: 'read'
    },
    {
      name: 'Enterprises',
      href: '/enterprises',
      icon: Building,
      module: 'enterprises',
      action: 'read'
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: UserCheck,
      module: 'employees',
      action: 'read'
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      module: 'products',
      action: 'read'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      module: 'reports',
      action: 'read'
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    hasPermission(item.module, item.action)
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">RBAC System</h1>
            <p className="text-sm text-slate-300">Enterprise Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-300 truncate">
              {user?.role?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:transform hover:scale-105'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;