import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, PlusCircle, Calendar, ExternalLink, Users, AlertCircle } from 'lucide-react';

export const CreateAssignmentPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [onedriveUrl, setOnedriveUrl] = useState('');
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'GROUPS'
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [availableGroups, setAvailableGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Default due date: 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split('T')[0]);

    // Fetch existing groups for targeting
    const fetchGroups = async () => {
      try {
        const res = await api.get('/admin/groups');
        if (res.success) {
          setAvailableGroups(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch groups for assignment creation:', err);
      }
    };

    fetchGroups();
  }, []);

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !onedriveUrl.trim() || !dueDate) {
      error('Please complete all required fields.');
      return;
    }

    if (targetType === 'GROUPS' && selectedGroupIds.length === 0) {
      error('Please select at least one group for targeted assignment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const combinedDateTime = new Date(`${dueDate}T${dueTime}:00`).toISOString();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate: combinedDateTime,
        onedriveUrl: onedriveUrl.trim(),
        targetType,
        assignedGroupIds: targetType === 'GROUPS' ? selectedGroupIds : [],
      };

      const res = await api.post('/assignments', payload);
      if (res.success) {
        success(`Assignment "${res.data.title}" published successfully!`);
        navigate('/admin/assignments');
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin/assignments"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Assignments
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create New Assignment
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Define assignment parameters, due dates, and OneDrive submission directory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems Lab 3: Raft Consensus"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description & Deliverable Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear technical objectives, deliverables, file formatting requirements, and grading criteria..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Time (24h) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* OneDrive URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OneDrive Submission URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={onedriveUrl}
                onChange={(e) => setOnedriveUrl(e.target.value)}
                placeholder="https://onedrive.live.com/..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Students will click this link to access the shared folder on OneDrive.
            </p>
          </div>

          {/* Target Audience */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Assignment Target Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  targetType === 'ALL'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">All Students & Groups</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Assigned to every current and future team</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('GROUPS')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  targetType === 'GROUPS'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Specific Groups Only</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Target selected project teams</p>
                </div>
              </button>
            </div>
          </div>

          {/* Group Checklist (if TargetType is GROUPS) */}
          {targetType === 'GROUPS' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <p className="text-xs font-bold text-slate-800">
                Select Groups to Assign ({selectedGroupIds.length} selected):
              </p>
              {availableGroups.length === 0 ? (
                <p className="text-xs text-slate-500">No student groups currently exist to select.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availableGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer hover:border-indigo-400"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => handleToggleGroup(g.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-800 font-semibold">{g.name}</span>
                      <span className="text-slate-400 text-[10px]">({g.code})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Link
              to="/admin/assignments"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
