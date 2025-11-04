import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export const useToastNotification = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastNotification must be used within ToastProvider');
  }
  return context;
};

const toastIcons = {
  success: { Icon: CheckCircle, className: 'text-success bg-success-light' },
  error: { Icon: XCircle, className: 'text-error bg-error-light' },
  warning: { Icon: AlertTriangle, className: 'text-warning bg-warning-light' },
  info: { Icon: Info, className: 'text-info bg-info-light' },
};

const Toast = ({ id, title, message, variant = 'info', onClose }) => {
  const { Icon, className } = toastIcons[variant];
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-full max-w-md sm:max-w-sm p-4 bg-white rounded-xl border border-neutral-200 shadow-2xl backdrop-blur-sm transition-all duration-200',
        isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'
      )}
    >
      <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", className)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="font-semibold text-sm text-neutral-900 mb-0.5">
          {title}
        </h4>
        {message && (
          <p className="text-xs text-neutral-600 line-clamp-2">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors group focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, variant = 'info', duration = 5000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, variant }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (title, message, duration) => addToast({ title, message, variant: 'success', duration }),
    error: (title, message, duration) => addToast({ title, message, variant: 'error', duration }),
    warning: (title, message, duration) => addToast({ title, message, variant: 'warning', duration }),
    info: (title, message, duration) => addToast({ title, message, variant: 'info', duration }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-4 right-4 sm:left-auto z-[100] flex flex-col gap-3 pointer-events-none items-center sm:items-end">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
