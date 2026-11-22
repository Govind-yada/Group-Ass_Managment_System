import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users2,
  FileText,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const StudentLayout = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Group', href: '/student/group', icon: Users2 },
    { name: 'Assignments', href: '/student/assignments', icon: FileText },
    { name: 'Submission History', href: '/student/submissions', icon: Clock },
    { name: 'Profile & Settings', href: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200/80 fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm mr-3">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight block text-lg leading-none">
              Joineazy
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
              Student Workspace
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=4f46e5&color=fff`
              }
              alt={user?.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.student_id || user?.email}</p>
            </div>
          </div>
          {user?.group ? (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Group:</span>
              <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                {user.group.name}
              </span>
            </div>
          ) : (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-amber-600 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
              No group joined yet
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-rose-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-lg">Joineazy</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-xl ${
                        isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
              <span>Student</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-semibold capitalize">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user?.group && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Users2 className="w-3.5 h-3.5 mr-1.5" />
                {user.group.name}
              </span>
            )}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=4f46e5&color=fff`
                }
                alt={user?.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="hidden md:inline text-sm font-medium text-slate-700">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
