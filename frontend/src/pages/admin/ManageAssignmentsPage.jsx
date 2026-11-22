import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  FileCheck2,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Users2,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';

export const ManageAssignmentsPage = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.success) {
        setAssignments(res.data || []);
      }
    } catch (err) {
      error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await api.delete(`/assignments/${deleteTarget.id}`);
      if (res.success) {
        success(`Assignment "${deleteTarget.title}" deleted successfully.`);
        setDeleteTarget(null);
        await fetchAssignments();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to delete assignment');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Assignments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Publish, edit, and configure academic deliverables and OneDrive destinations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/assignments/new"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Assignment
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by assignment title, keywords, or description..."
          className="w-full text-sm bg-transparent border-none focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Assignment List Table */}
      {loading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No assignments found"
          description={
            searchQuery
              ? `No assignments match "${searchQuery}".`
              : 'You have not created any assignments yet. Get started by creating your first assignment.'
          }
          actionLabel="Create Assignment"
          onAction={() => (window.location.href = '/admin/assignments/new')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assignment Details</th>
                  <th className="py-3.5 px-6">Target</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Submission Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 max-w-sm">
                      <p className="font-bold text-slate-900 leading-snug">{assignment.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                        {assignment.description}
                      </p>
                      <a
                        href={assignment.onedrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[11px] font-medium text-indigo-600 hover:text-indigo-700 mt-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        OneDrive Target Link
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={assignment.target_type} size="sm" />
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(assignment.due_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            {assignment.submitted_count} of {assignment.total_groups_assigned} Groups
                          </span>
                          <span className="text-slate-500 font-medium">
                            {assignment.completion_percentage}%
                          </span>
                        </div>
                        <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${assignment.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <Link
                          to={`/admin/assignments/edit/${assignment.id}`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Assignment"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(assignment)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Safeguard Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        type="danger"
        title="Delete Assignment Safeguard"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated submission records and group links in PostgreSQL will also be deleted.`}
        confirmText="Permanently Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};
