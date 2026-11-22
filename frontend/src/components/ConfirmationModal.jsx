import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X, ShieldAlert } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'primary' | 'danger' | 'success'
  isLoading = false,
  declarationNotice = null,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    primary: {
      icon: HelpCircle,
      iconBg: 'bg-indigo-50 text-indigo-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    },
    danger: {
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 text-rose-600',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
    },
  }[type] || {
    icon: HelpCircle,
    iconBg: 'bg-indigo-50 text-indigo-600',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
  };

  const IconComponent = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-6">
            <div className="flex items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl sm:mx-0 sm:h-10 sm:w-10 ${typeConfig.iconBg}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3 className="text-lg font-semibold leading-6 text-slate-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {message}
                  </p>
                </div>

                {declarationNotice && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 leading-relaxed flex items-start">
                    <AlertCircle className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>{declarationNotice}</div>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-500 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:w-auto transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`inline-flex w-full justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto transition-all disabled:opacity-50 flex items-center ${typeConfig.buttonBg}`}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
