import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage = () => {
  const { user } = useAuth();
  const homePath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied (403)</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You do not have the required permissions or role privileges to view this page. This area is strictly restricted.
        </p>
        <Link
          to={homePath}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Your Dashboard
        </Link>
      </div>
    </div>
  );
};
