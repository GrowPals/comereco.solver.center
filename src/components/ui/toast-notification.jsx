import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const useToastNotification = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastNotification must be used within ToastProvider');
  }
  return context;
};

const toastIcons = {
  success: { Icon: CheckCircle, className: 'text-green-600 bg-gradient-to-br from-green-100 to-green-50' },
  error: { Icon: XCircle, className: 'text-red-600 bg-gradient-to-br from-red-100 to-red-50' },
  warning: { Icon: AlertTriangle, className: 'text-yellow-600 bg-gradient-to-br from-yellow-100 to-yellow-50' },
  info: { Icon: Info, className: 'text-blue-600 bg-gradient-to-br from-blue-100 to-blue-50' },
};

const Toast = ({ id, title, message, variant = 'info', onClose }) => {
  const { Icon, className } = toastIcons[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 200, scale: 0.5 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 w-full max-w-md p-4 bg-white rounded-xl border border-neutral-200 shadow-2xl backdrop-blur-sm"
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
        onClick={() => onClose(id)}
        className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors group"
      >
        <X className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
      </button>
    </motion.div>
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
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} onClose={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
