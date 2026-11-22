import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Calendar,
  Users2,
  ArrowUpDown,
  UserCheck,
} from 'lucide-react';

export const SubmissionMonitoringPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'PENDING'
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'title'

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const assignRes = await api.get('/assignments');
        if (assignRes.success) {
          setAssignments(assignRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };

    fetchMetadata();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (assignmentFilter) params.append('assignmentId', assignmentFilter);

      const res = await api.get(`/admin/submissions?${params.toString()}`);
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch submission monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, assignmentFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side sorting
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortOrder === 'newest') {
      const dateA = a.submitted_at ? new Date(a.submitted_at) : new Date(0);
      const dateB = b.submitted_at ? new Date(b.submitted_at) : new Date(0);
      return dateB - dateA;
    }
    if (sortOrder === 'oldest') {
      const dateA = a.submitted_at ? new Date(a.submitted_at) : new Date(0);
      const dateB = b.submitted_at ? new Date(b.submitted_at) : new Date(0);
      return dateA - dateB;
    }
    if (sortOrder === 'title') {
      return a.assignment_title.localeCompare(b.assignment_title);
    }
    return 0;
  });

  const totalCount = submissions.length;
  const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const pendingCount = totalCount - submittedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Submission Monitoring
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Audit group submission declarations, student timestamps, and OneDrive milestones
          </p>
        </div>

        {/* Aggregate count badges */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {submittedCount} Submitted
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by assignment, group name, code, or student ID..."
            className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted Only</option>
            <option value="PENDING">Pending Only</option>
          </select>

          {/* Assignment Dropdown Filter */}
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[200px] truncate"
          >
            <option value="">All Assignments</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: By Assignment</option>
          </select>
        </div>
      </div>

      {/* Main Submission Monitoring Table */}
      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : sortedSubmissions.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No submission records found"
          description="Try adjusting your search queries or filter selections above."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assignment</th>
                  <th className="py-3.5 px-6">Group & Members</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Submission Details</th>
                  <th className="py-3.5 px-6 text-right">OneDrive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSubmissions.map((sub) => {
                  const isSubmitted = sub.status === 'SUBMITTED';

                  return (
                    <tr key={`${sub.assignment_id}-${sub.group_id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 max-w-xs">
                        <p className="font-bold text-slate-900 leading-snug">{sub.assignment_title}</p>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due: {new Date(sub.due_date).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{sub.group_name}</span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {sub.group_code}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sub.group_members?.map((m) => (
                            <span
                              key={m.id}
                              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                              title={`${m.name} (${m.student_id})`}
                            >
                              {m.name.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={sub.status} />
                      </td>

                      <td className="py-4 px-6 text-xs">
                        {isSubmitted ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900 flex items-center">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500 mr-1" />
                              {sub.submitted_by_name} ({sub.submitted_by_student_id})
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              {new Date(sub.submitted_at).toLocaleString()}
                            </p>
                            {sub.notes && (
                              <p className="text-[11px] text-slate-400 italic line-clamp-1">
                                "{sub.notes}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No declaration recorded yet</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <a
                          href={sub.onedrive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Open OneDrive Folder"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
