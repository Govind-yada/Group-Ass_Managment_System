import React from 'react';

export const ProgressBar = ({
  progress = 0,
  size = 'md',
  showLabel = true,
  label = 'Progress',
  color = 'brand',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size] || 'h-2.5';

  const getColorClass = () => {
    if (color === 'brand') {
      if (clamped >= 100) return 'bg-emerald-500';
      if (clamped >= 50) return 'bg-indigo-600';
      return 'bg-amber-500';
    }
    if (color === 'emerald') return 'bg-emerald-500';
    if (color === 'amber') return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-600">
          <span>{label}</span>
          <span className="font-semibold text-slate-900">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out ${getColorClass()}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
