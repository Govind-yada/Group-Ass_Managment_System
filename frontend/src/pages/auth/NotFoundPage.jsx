import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NotFoundPage = () => {
  const { user } = useAuth();
  const homePath = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard') : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found (404)</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          The requested page could not be found. It may have been relocated, deleted, or never existed.
        </p>
        <Link
          to={homePath}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go to Home
        </Link>
      </div>
    </div>
  );
};
