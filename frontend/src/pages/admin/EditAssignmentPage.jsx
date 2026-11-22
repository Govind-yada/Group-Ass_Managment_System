import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ArrowLeft, Save, Calendar, ExternalLink, Users } from 'lucide-react';

export const EditAssignmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [onedriveUrl, setOnedriveUrl] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assignRes, groupsRes] = await Promise.all([
          api.get(`/assignments/${id}`),
          api.get('/admin/groups'),
        ]);

        if (assignRes.success) {
          const a = assignRes.data;
          setTitle(a.title);
          setDescription(a.description);
          setOnedriveUrl(a.onedrive_url);
          setTargetType(a.target_type);

          const d = new Date(a.due_date);
          setDueDate(d.toISOString().split('T')[0]);
          setDueTime(d.toTimeString().slice(0, 5));

          if (a.assigned_groups) {
            setSelectedGroupIds(a.assigned_groups.map((g) => g.group_id));
          }
        }

        if (groupsRes.success) {
          setAvailableGroups(groupsRes.data || []);
        }
      } catch (err) {
        error('Failed to load assignment details');
        navigate('/admin/assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((gid) => gid !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const combinedDateTime = new Date(`${dueDate}T${dueTime}:00`).toISOString();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate: combinedDateTime,
        onedriveUrl: onedriveUrl.trim(),
        targetType,
        assignedGroupIds: targetType === 'GROUPS' ? selectedGroupIds : [],
      };

      const res = await api.put(`/assignments/${id}`, payload);
      if (res.success) {
        success('Assignment updated successfully!');
        navigate('/admin/assignments');
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to update assignment');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            Edit Assignment
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Update assignment parameters, instructions, and OneDrive link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">OneDrive URL</label>
            <input
              type="url"
              required
              value={onedriveUrl}
              onChange={(e) => setOnedriveUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {targetType === 'GROUPS' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <p className="text-xs font-bold text-slate-800">
                Assigned Groups ({selectedGroupIds.length} selected):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => handleToggleGroup(g.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 font-semibold">{g.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Link
              to="/admin/assignments"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
