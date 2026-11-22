import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ProgressBar } from '../../components/ProgressBar';
import {
  Users2,
  UserPlus,
  Crown,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  Info,
  Calendar,
  Mail,
  Hash,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

export const MyGroupPage = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create Group Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [isCreating, setIsCreating] = useState(false);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Remove Member Modal
  const [removeTargetUser, setRemoveTargetUser] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups/my-group');
      if (res.success) {
        setGroup(res.data);
      } else {
        setGroup(null);
      }
    } catch (err) {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const handleCopyCode = () => {
    if (group?.code) {
      navigator.clipboard.writeText(group.code);
      setCopiedCode(true);
      success(`Group code ${group.code} copied to clipboard!`);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      error('Please enter a valid group name');
      return;
    }

    try {
      setIsCreating(true);
      const res = await api.post('/groups', {
        name: newGroupName.trim(),
        maxMembers: parseInt(maxMembers, 10),
      });

      if (res.success) {
        success(`Group "${res.data.name}" created successfully!`);
        setShowCreateModal(false);
        setNewGroupName('');
        await fetchGroupData();
        await refreshUser();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberIdentifier.trim()) {
      error('Please enter student email or student ID');
      return;
    }

    try {
      setIsAddingMember(true);
      const res = await api.post(`/groups/${group.id}/members`, {
        identifier: memberIdentifier.trim(),
      });

      if (res.success) {
        success('Student added to group successfully!');
        setShowAddMemberModal(false);
        setMemberIdentifier('');
        await fetchGroupData();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeTargetUser) return;

    try {
      setIsRemovingMember(true);
      const res = await api.delete(`/groups/${group.id}/members/${removeTargetUser.id}`);

      if (res.success) {
        if (res.data?.disbanded) {
          success('Group was disbanded.');
          setGroup(null);
          await refreshUser();
        } else {
          success(`${removeTargetUser.name} was removed from the group.`);
          await fetchGroupData();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
      setRemoveTargetUser(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  // Case 1: Student is NOT in any group
  if (!group) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Users2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">You are not in a group yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Assignments are submitted and tracked collectively by project groups. Form a new group and invite your peers, or have a group leader add you using your Student ID ({user?.student_id}).
          </p>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create a New Group
            </button>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-left text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center">
              <Info className="w-4 h-4 text-indigo-600 mr-1.5" />
              Important Membership Policies:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>Each student can only belong to exactly one project group.</li>
              <li>The student who creates the group automatically becomes the Group Leader.</li>
              <li>Group Leaders can add members and manage group submissions.</li>
              <li>Give your Student ID (<strong className="text-slate-700">{user?.student_id}</strong>) to your group leader so they can add you.</li>
            </ul>
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Create Project Group</h3>
                <p className="text-xs text-slate-500 mb-4">You will be designated as the group leader.</p>

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Group Name</label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. Distributed Pioneers"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Group Capacity</label>
                    <select
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="3">3 Members</option>
                      <option value="4">4 Members</option>
                      <option value="5">5 Members (Standard)</option>
                      <option value="6">6 Members</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isCreating ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Student is an active member/leader of a group
  const isLeader = group.is_leader;
  const isAtCapacity = group.members.length >= group.max_members;

  return (
    <div className="space-y-6">
      {/* Group Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {group.name}
              </h1>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                title="Click to copy group code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
                {group.code}
              </button>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Formed on {new Date(group.created_at).toLocaleDateString()} • Leader: <strong className="text-slate-800">{group.leader_name}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isLeader && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                disabled={isAtCapacity}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            )}
          </div>
        </div>

        {/* Capacity & Progress Indicators */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1 font-medium text-slate-600">
              <span>Group Roster Capacity</span>
              <span className="font-semibold text-slate-900">{group.members.length} / {group.max_members} Members</span>
            </div>
            <ProgressBar
              progress={(group.members.length / group.max_members) * 100}
              size="sm"
              showLabel={false}
              color="brand"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1 font-medium text-slate-600">
              <span>Assignment Completion</span>
              <span className="font-semibold text-slate-900">{group.stats?.completionPercentage || 0}%</span>
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

      {/* Member Roster Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Group Members ({group.members.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Students collaborating on project deliverables</p>
          </div>
          {isLeader && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Leader Controls Active
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {group.members.map((member) => {
            const isMemberLeader = member.id === group.leader_id;
            const isCurrentUser = member.id === user.id;

            return (
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
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{member.name}</p>
                      {isCurrentUser && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          You
                        </span>
                      )}
                      {isMemberLeader && (
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

                <div>
                  {/* Remove Button (Only for Leader removing other members, or Leader disbanding) */}
                  {isLeader && !isMemberLeader && (
                    <button
                      onClick={() => setRemoveTargetUser(member)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowAddMemberModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Add Group Member</h3>
              <p className="text-xs text-slate-500 mb-4">
                Enter the registered student's university email or Student ID.
              </p>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Identifier</label>
                  <input
                    type="text"
                    required
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                    placeholder="e.g. CS202603 or charlie@student.joineazy.edu"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800 mb-1">Validation Rules:</p>
                  <p>• Student must be registered in Joineazy.</p>
                  <p>• Student must not already belong to another group.</p>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Safeguard Modal */}
      <ConfirmationModal
        isOpen={!!removeTargetUser}
        onClose={() => setRemoveTargetUser(null)}
        onConfirm={handleConfirmRemoveMember}
        type="danger"
        title="Remove Member from Group"
        message={`Are you sure you want to remove ${removeTargetUser?.name} from ${group.name}? They will lose access to group submissions and progress.`}
        confirmText="Remove Member"
        isLoading={isRemovingMember}
      />
    </div>
  );
};
