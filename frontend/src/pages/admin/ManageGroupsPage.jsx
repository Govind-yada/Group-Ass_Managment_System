import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { ProgressBar } from '../../components/ProgressBar';
import {
  FolderGit2,
  Search,
  Users2,
  Crown,
  Calendar,
  CheckCircle2,
  Mail,
  Hash,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const ManageGroupsPage = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/groups');
      if (res.success) {
        setGroups(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.leader_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Student Groups
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor student team compositions, leaders, capacity, and submission progress
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-center">
          {groups.length} Active Groups
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by group name, code, or leader name..."
          className="w-full text-sm bg-transparent border-none focus:outline-none placeholder-slate-400"
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No groups found"
          description={
            searchQuery
              ? `No student groups match "${searchQuery}".`
              : 'No project groups have been formed by students yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {group.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Crown className="w-3.5 h-3.5 text-amber-500 mr-1" />
                      Leader: <strong className="text-slate-800 ml-1">{group.leader_name}</strong>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span>{group.leader_student_id}</span>
                    </p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {group.member_count} / {group.max_members} Members
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-600">
                    <span>Deliverable Milestone Progress</span>
                    <span className="font-bold text-slate-900">
                      {group.stats?.completed || 0} of {group.stats?.totalAssigned || 0} Submitted ({group.stats?.completionPercentage || 0}%)
                    </span>
                  </div>
                  <ProgressBar
                    progress={group.stats?.completionPercentage || 0}
                    size="sm"
                    showLabel={false}
                    color="brand"
                  />
                </div>

                {/* Members list */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Group Roster:</p>
                  <div className="space-y-1.5">
                    {group.members?.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50/80 text-slate-700"
                      >
                        <span className="font-medium text-slate-900 flex items-center truncate">
                          {m.is_leader && <Crown className="w-3 h-3 text-amber-500 mr-1 flex-shrink-0" />}
                          {m.name}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{m.student_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/admin/submissions?search=${encodeURIComponent(group.name)}`}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View Group Submissions
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
