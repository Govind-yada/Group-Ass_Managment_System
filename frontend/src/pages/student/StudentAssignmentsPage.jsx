import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  AlertCircle,
  Users,
  ChevronRight,
  Send,
} from 'lucide-react';

export const StudentAssignmentsPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'SUBMITTED'
  const [searchQuery, setSearchQuery] = useState('');

  // Two-Step Submission Confirmation State
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');

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

  // Step 1: Student clicks "Yes, I have submitted"
  const handleInitiateSubmission = (assignment) => {
    if (!user.group) {
      error('You must belong to a project group to submit assignments.');
      return;
    }
    if (assignment.submission_status === 'SUBMITTED') {
      error('This assignment has already been declared as submitted.');
      return;
    }
    setSubmittingAssignment(assignment);
    setSubmissionNotes('');
  };

  // Step 2: Student confirms in modal
  const handleConfirmSubmission = async () => {
    if (!submittingAssignment) return;

    try {
      setIsConfirming(true);
      const res = await api.post(`/submissions/${submittingAssignment.id}/confirm`, {
        notes: submissionNotes.trim() || 'Declared OneDrive file upload.',
      });

      if (res.success) {
        success(`Submission declared and confirmed for "${submittingAssignment.title}"!`);
        setSubmittingAssignment(null);
        await fetchAssignments();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Submission failed.');
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesStatus =
      statusFilter === 'ALL' || a.submission_status === statusFilter;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Course Assignments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Access OneDrive submission folders and confirm deliverable milestones
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments..."
              className="w-full sm:w-64 pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {['ALL', 'PENDING', 'SUBMITTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No group alert banner */}
      {!user.group && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Group Required for Submissions</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You are currently unassigned. You must join or create a project group before you can declare submissions.
            </p>
          </div>
          <Link
            to="/student/group"
            className="px-3 py-1.5 bg-amber-600 text-white font-semibold text-xs rounded-lg hover:bg-amber-700 transition-colors"
          >
            Join Group
          </Link>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments found"
          description={
            searchQuery
              ? `No assignments match your search "${searchQuery}".`
              : 'There are no assignments matching the selected criteria.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const isSubmitted = assignment.submission_status === 'SUBMITTED';

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all duration-150"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={assignment.submission_status} />
                      <StatusBadge status={assignment.target_type} size="sm" />
                      {assignment.is_overdue && !isSubmitted && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/student/assignments/${assignment.id}`}
                      className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                    >
                      {assignment.title}
                    </Link>

                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {assignment.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Due:{' '}
                        {new Date(assignment.due_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(assignment.due_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span>Created by {assignment.creator_name}</span>
                    </div>

                    {/* Submission metadata banner if submitted */}
                    {isSubmitted && (
                      <div className="mt-4 p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                        <span className="flex items-center font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                          Confirmed by {assignment.submitted_by_name || 'Group Member'} on{' '}
                          {new Date(assignment.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                    {/* OneDrive Link Button */}
                    <a
                      href={assignment.onedrive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      Open OneDrive Link
                    </a>

                    {/* Step 1: "Yes, I have submitted" button */}
                    {!isSubmitted ? (
                      <button
                        onClick={() => handleInitiateSubmission(assignment)}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Yes, I have submitted
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Submission Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 2 Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!submittingAssignment}
        onClose={() => setSubmittingAssignment(null)}
        onConfirm={handleConfirmSubmission}
        type="primary"
        title="Confirm OneDrive Submission"
        message="Are you sure your group has successfully uploaded the assignment to OneDrive?"
        confirmText="Confirm Submission"
        cancelText="Cancel"
        isLoading={isConfirming}
        declarationNotice="Important: Submission confirmation is based on your user declaration. Joineazy does not crawl or verify OneDrive uploads directly. Your timestamp and student credentials will be officially recorded in the audit log."
      />
    </div>
  );
};
