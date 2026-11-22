import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Clock, CheckCircle2, ExternalLink, Calendar, Hash, UserCheck } from 'lucide-react';

export const StudentSubmissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/submissions/history/my');
        if (res.success) {
          setHistory(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load submission history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Submission History
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Official audit log of your group's confirmed OneDrive submissions
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : history.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No confirmed submissions yet"
          description="When members of your group declare submissions for assignments, they will be archived here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assignment Title</th>
                  <th className="py-3.5 px-6">Confirmed By</th>
                  <th className="py-3.5 px-6">Submission Time</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">OneDrive Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <Link
                        to={`/student/assignments/${sub.assignment_id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {sub.assignment_title}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{sub.submitted_by_name}</span>
                        <span className="text-xs text-slate-400">({sub.submitted_by_student_id})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmed
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={sub.onedrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        OneDrive Folder
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
