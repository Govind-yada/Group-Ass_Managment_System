import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Users2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-slate-900 block leading-tight">
              Joineazy
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Academic Management Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <Outlet />
        </div>

        {/* Feature badges footer */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-slate-500">
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" />
            Role-Based Access
          </span>
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-1.5" />
            OneDrive Integration
          </span>
          <span className="flex items-center">
            <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" />
            Live Analytics
          </span>
        </div>
      </div>
    </div>
  );
};
