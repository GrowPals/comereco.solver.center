/**
 * FormStatusFeedback Component
 * Componente para mostrar feedback visual de estados en formularios
 */
import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FormStatusFeedback = ({ 
  status, // 'idle' | 'loading' | 'success' | 'error'
  message,
  className = ''
}) => {
  if (status === 'idle' || !message) return null;

  const statusConfig = {
    loading: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary-500" />,
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      borderColor: 'border-primary-200',
    },
    success: {
      icon: <CheckCircle className="h-5 w-5 text-success" />,
      bgColor: 'bg-success-light',
      textColor: 'text-success-dark',
      borderColor: 'border-success',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-error" />,
      bgColor: 'bg-error-light',
      textColor: 'text-error-dark',
      borderColor: 'border-error',
    },
    info: {
      icon: <Info className="h-5 w-5 text-info" />,
      bgColor: 'bg-info-light',
      textColor: 'text-info-dark',
      borderColor: 'border-info',
    },
  };

  const config = statusConfig[status] || statusConfig.info;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 animate-fadeIn',
        config.bgColor,
        config.borderColor,
        config.textColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <p className="text-sm font-medium flex-1">{message}</p>
    </div>
  );
};

export default FormStatusFeedback;

