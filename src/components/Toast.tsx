import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertCircle, X, ClipboardCheck, Sparkles } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 6500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        className={`rounded-2xl shadow-xl p-4 border backdrop-blur-md flex items-start gap-3 text-slate-900 ${
          toast.type === 'success'
            ? 'bg-emerald-50/95 border-emerald-300 ring-2 ring-emerald-500/20'
            : toast.type === 'warning'
            ? 'bg-amber-50/95 border-amber-300 ring-2 ring-amber-500/20'
            : 'bg-blue-50/95 border-blue-300 ring-2 ring-blue-500/20'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'warning'
              ? 'bg-amber-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <ClipboardCheck className="w-5 h-5" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold text-slate-900">
              {toast.type === 'success' ? 'সফলভাবে প্রস্তুত' : 'অবহিতকরণ'}
            </span>
            {toast.message.includes('Ctrl+V') && (
              <span className="px-1.5 py-0.2 bg-emerald-200/80 border border-emerald-400 text-emerald-900 rounded font-mono font-bold text-[10px]">
                Ctrl + V
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
