import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ArrowLeft,
  FolderGit2,
  Users2,
  Crown,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Hash,
  Eye,
} from 'lucide-react';

export const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const [groupRes, subRes] = await Promise.all([
          api.get(`/groups/${id}`),
          api.get(`/admin/submissions?search=${encodeURIComponent(id)}`),
        ]);

        if (groupRes.success) {
          setGroup(groupRes.data);
        }

        if (subRes.success) {
          // Filter submissions matching this group
          const matched = (subRes.data || []).filter((s) => s.group_id === id);
          setSubmissions(matched);
        }
      } catch (err) {
        console.error('Failed to load group details:', err);
        navigate('/admin/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id, navigate]);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  if (!group) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          to="/admin/groups"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Groups
        </Link>
      </div>

      {/* Group Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {group.name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {group.code}
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Formed on {new Date(group.created_at).toLocaleDateString()} • Leader:{' '}
              <strong className="text-slate-800 ml-1">{group.leader_name}</strong>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>{group.leader_student_id}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={`/admin/submissions?search=${encodeURIComponent(group.name)}`}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Monitor Submissions
            </Link>
          </div>
        </div>

        {/* Progress & Capacity Bars */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-600">
              <span>Member Roster</span>
              <span className="font-semibold text-slate-900">
                {group.members?.length || 0} / {group.max_members} Members
              </span>
            </div>
            <ProgressBar
              progress={((group.members?.length || 0) / group.max_members) * 100}
              size="sm"
              showLabel={false}
              color="brand"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-600">
              <span>Assignment Milestone Progress</span>
              <span className="font-semibold text-slate-900">
                {group.stats?.completionPercentage || 0}% Completed
              </span>
            </div>
            <ProgressBar
              progress={group.stats?.completionPercentage || 0}
              size="sm"
              showLabel={false}
              color="emerald"
            />
          </div>
        </div>
      </div>

      {/* Group Members Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Group Roster ({group.members?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Enrolled student team members</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {group.members?.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <img
                  src={
                    member.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4f46e5&color=fff`
                  }
                  alt={member.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{member.name}</p>
                    {member.is_leader && (
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Crown className="w-3 h-3 mr-1 text-amber-500" />
                        Leader
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                      {member.student_id || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center truncate">
                      <Mail className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                      {member.email}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs text-slate-400 hidden sm:inline">
                Joined: {new Date(member.joined_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Group Submissions Record */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Assigned Deliverables & Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Submission status for this specific team</p>
        </div>

        {submissions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No submissions recorded yet for this group.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Assignment Title</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Confirmed By</th>
                  <th className="py-3.5 px-6 text-right">OneDrive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.submission_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {sub.assignment_title}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(sub.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {sub.status === 'SUBMITTED' ? (
                        <div>
                          <p className="font-semibold text-slate-900">{sub.submitted_by_name}</p>
                          <p className="text-slate-400 text-[11px]">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={sub.onedrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        OneDrive
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
