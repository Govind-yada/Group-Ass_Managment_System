import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  FolderGit2,
  FileCheck2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, analyticsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics'),
        ]);

        if (dashRes.success) setDashboardData(dashRes.data);
        if (analyticsRes.success) setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} />
        <div className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
      </div>
    );
  }

  const { summary, upcomingDeadlines, recentActivities } = dashboardData || {
    summary: {},
    upcomingDeadlines: [],
    recentActivities: [],
  };

  const { assignmentStats = [], groupProgress = [], statusDistribution = [] } =
    analyticsData || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Professor Oversight Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time PostgreSQL analytics across cohorts, groups, and OneDrive submission milestones
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/assignments/new"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Create Assignment
          </Link>
          <Link
            to="/admin/submissions"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            Monitor Submissions
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <StatCard
            title="Total Registered Students"
            value={summary.totalStudents || 0}
            subtitle="Verified university accounts"
            icon={Users}
            color="indigo"
          />
        </div>
        <div className="lg:col-span-2">
          <StatCard
            title="Active Student Groups"
            value={summary.totalGroups || 0}
            subtitle="Collaborative project teams"
            icon={FolderGit2}
            color="blue"
          />
        </div>
        <div className="lg:col-span-2">
          <StatCard
            title="Total Deliverables"
            value={summary.totalAssignments || 0}
            subtitle="Published assignments"
            icon={FileCheck2}
            color="purple"
          />
        </div>
        <div className="lg:col-span-2">
          <StatCard
            title="Completed Submissions"
            value={summary.completedSubmissions || 0}
            subtitle="Confirmed OneDrive uploads"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>
        <div className="lg:col-span-2">
          <StatCard
            title="Pending Submissions"
            value={summary.pendingSubmissions || 0}
            subtitle="Awaiting group declaration"
            icon={Clock}
            color="amber"
          />
        </div>
        <div className="lg:col-span-2">
          <StatCard
            title="Overall Completion Rate"
            value={`${summary.overallCompletionRate || 0}%`}
            subtitle="Cohort submission velocity"
            icon={TrendingUp}
            color="emerald"
          />
        </div>
      </div>

      {/* Visual Analytics Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Assignment Submission Comparison (BarChart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assignment Submission Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Completed vs Pending group declarations per assignment
              </p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Full Analytics
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="h-72 w-full mt-4">
            {assignmentStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No assignment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="submitted" name="Submitted" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Submission Status Distribution (PieChart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Submission Status Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Overall submission health</p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {statusDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-600 truncate">{entry.name}:</span>
                <span className="font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deadlines & Activity Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignment Deadlines */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
              <p className="text-xs text-slate-500 mt-0.5">Next upcoming assignment milestones</p>
            </div>
            <Link
              to="/admin/assignments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Manage
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingDeadlines.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No active upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{item.target_type === 'ALL' ? 'All Cohort' : 'Specific Groups'}</span>
                    </div>
                  </div>
                  <a
                    href={item.onedrive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="OneDrive link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Platform Activities</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live audit trail from PostgreSQL</p>
            </div>
            <span className="flex items-center text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              Live
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No recent activities recorded.</p>
            ) : (
              recentActivities.map((log) => (
                <div key={log.id} className="py-3 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {log.details || log.action}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      • {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
