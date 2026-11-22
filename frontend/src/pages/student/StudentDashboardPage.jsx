import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FileText,
  CheckCircle2,
  Clock,
  Users2,
  ArrowRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  PlusCircle,
  Activity,
} from 'lucide-react';

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [group, setGroup] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assignRes, groupRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/groups/my-group'),
        ]);

        if (assignRes.success) setAssignments(assignRes.data || []);
        if (groupRes.success) setGroup(groupRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.submission_status === 'SUBMITTED').length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Upcoming assignments (sorted by due date, pending first)
  const upcomingAssignments = [...assignments]
    .filter((a) => a.submission_status === 'PENDING')
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-3">
            Student ID: {user?.student_id || 'CS2026'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            {group
              ? `You are collaborating in "${group.name}". Check your active deliverables and OneDrive submission checkpoints below.`
              : 'You have not joined a group yet. Form or join a group to coordinate assignments and declare submissions.'}
          </p>

          {!group && (
            <div className="mt-4">
              <Link
                to="/student/group"
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create or Join a Group
              </Link>
            </div>
          )}
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute right-24 top-0 -translate-y-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none"></div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Deliverables"
          value={totalAssignments}
          subtitle="Assigned to your cohort"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Completed Submissions"
          value={completedAssignments}
          subtitle="Declared on OneDrive"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Submissions"
          value={pendingAssignments}
          subtitle="Awaiting group action"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Group Completion"
          value={`${completionRate}%`}
          subtitle={group ? `For ${group.name}` : 'No group active'}
          icon={Users2}
          color="blue"
        />
      </div>

      {/* Progress & Deadlines Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall Group Progress */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Group Progress</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {completedAssignments} of {totalAssignments} Done
              </span>
            </div>

            <div className="my-6">
              <div className="text-center mb-4">
                <span className="text-4xl font-extrabold text-slate-900">{completionRate}%</span>
                <span className="text-xs text-slate-500 block mt-1">Overall Completion Rate</span>
              </div>
              <ProgressBar progress={completionRate} size="lg" showLabel={false} />
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                  Completed
                </span>
                <span className="font-semibold text-slate-900">{completedAssignments}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span>
                  Pending
                </span>
                <span className="font-semibold text-slate-900">{pendingAssignments}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            {group ? (
              <Link
                to="/student/group"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Manage {group.name}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <Link
                to="/student/group"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Set Up Your Group
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Right: Upcoming Deadlines & Action Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Assignment Deadlines</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tasks requiring declaration and submission</p>
            </div>
            <Link
              to="/student/assignments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-slate-800">You are all caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending assignments due right now.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {upcomingAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/70 hover:border-indigo-200 hover:bg-slate-50/50 transition-all gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {assign.title}
                      </span>
                      {assign.is_overdue && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Due: {new Date(assign.due_date).toLocaleDateString()} at{' '}
                        {new Date(assign.due_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>By {assign.creator_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <a
                      href={assign.onedrive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      title="Open OneDrive folder"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      OneDrive
                    </a>
                    <Link
                      to={`/student/assignments/${assign.id}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
                    >
                      Submit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
