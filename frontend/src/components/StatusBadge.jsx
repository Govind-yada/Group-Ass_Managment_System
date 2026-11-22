import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const norm = String(status || '').toUpperCase();

  const configs = {
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: CheckCircle2,
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: Clock,
    },
    OVERDUE: {
      label: 'Overdue',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: AlertTriangle,
    },
    ACTIVE: {
      label: 'Active',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      icon: Clock,
    },
    ALL: {
      label: 'All Students',
      bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      icon: Users,
    },
    GROUPS: {
      label: 'Specific Groups',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      icon: Users,
    },
    LEADER: {
      label: 'Leader',
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: null,
    },
    MEMBER: {
      label: 'Member',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: null,
    },
  };

  const config = configs[norm] || {
    label: status,
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: null,
  };

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.bg}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />}
      {config.label}
    </span>
  );
};
