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
        'flex w-full max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-2xl backdrop-blur-sm transition-all duration-200 sm:max-w-sm dark:border-border dark:bg-card',
        isExiting ? 'translate-x-full scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
      )}
    >
      <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm", className)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <h4 className="mb-0.5 text-sm font-semibold text-foreground">
          {title}
        </h4>
        {message && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="group flex h-8 w-8 items-center justify-center flex-shrink-0 rounded-lg transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 dark:hover:bg-muted/40"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
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
      <div className="fixed top-4 left-4 right-4 sm:left-auto z-[1700] flex flex-col gap-3 pointer-events-none items-center sm:items-end">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
