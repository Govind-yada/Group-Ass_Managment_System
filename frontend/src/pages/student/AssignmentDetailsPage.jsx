import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Send,
  Users2,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);

  // Two-step confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assignments/${id}`);
      if (res.success) {
        setAssignment(res.data);
      }
    } catch (err) {
      error('Failed to load assignment details.');
      navigate('/student/assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  const handleConfirmSubmission = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.post(`/submissions/${id}/confirm`, {
        notes: notes.trim() || 'Declared OneDrive file upload.',
      });

      if (res.success) {
        success('Assignment submission declared and recorded in PostgreSQL successfully!');
        setShowConfirmModal(false);
        await fetchAssignmentDetails();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Submission confirmation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!assignment) {
    return null;
  }

  const isSubmitted = assignment.submission?.status === 'SUBMITTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/student/assignments"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Assignments
        </Link>
      </div>

      {/* Main Assignment Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <StatusBadge status={assignment.submission?.status || 'PENDING'} />
            <StatusBadge status={assignment.target_type} size="sm" />
            {assignment.is_overdue && !isSubmitted && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                Overdue
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {assignment.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center font-medium">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
              Due:{' '}
              {new Date(assignment.due_date).toLocaleDateString(undefined, {
                weekday: 'short',
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
            <span>Created by {assignment.creator_name} ({assignment.creator_email})</span>
          </div>
        </div>

        {/* Deliverable Instructions */}
        <div className="pt-6 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">
            Deliverable Instructions & Requirements
          </h2>
          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {assignment.description}
          </div>
        </div>

        {/* OneDrive Submission Link Card */}
        <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-950">OneDrive Deliverables Folder</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Upload your team's code, documents, and presentation assets to OneDrive.
              </p>
            </div>
          </div>

          <a
            href={assignment.onedrive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"
          >
            Open in OneDrive
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>
        </div>

        {/* Submission Confirmation Card */}
        <div className="pt-6 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">
            Group Submission Declaration
          </h2>

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-base text-emerald-950">
                  Submission Officially Confirmed & Recorded
                </span>
              </div>
              <div className="text-xs text-emerald-800 space-y-1 pl-7.5">
                <p>
                  <strong>Confirmed By:</strong>{' '}
                  {assignment.submission?.submitted_by_name} (
                  {assignment.submission?.submitted_by_student_id})
                </p>
                <p>
                  <strong>Submission Timestamp:</strong>{' '}
                  {new Date(assignment.submission?.submitted_at).toLocaleString()}
                </p>
                {assignment.submission?.notes && (
                  <p>
                    <strong>Declaration Notes:</strong> {assignment.submission?.notes}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Awaiting Group Upload Confirmation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Once your team has completed uploading all required files to the shared OneDrive directory, click below to confirm your deliverable milestone.
                  </p>
                </div>
              </div>

              {!user.group ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
                  <span>You must be a member of a group to submit assignments.</span>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Yes, I have submitted
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmission}
        type="primary"
        title="Confirm OneDrive Submission"
        message="Are you sure your group has successfully uploaded the assignment to OneDrive?"
        confirmText="Confirm Submission"
        cancelText="Cancel"
        isLoading={isSubmitting}
        declarationNotice="Important: Submission confirmation is based on your user declaration. Joineazy does not crawl or verify OneDrive uploads directly. Your timestamp and student credentials will be officially recorded in the audit log."
      />
    </div>
  );
};
