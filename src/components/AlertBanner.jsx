import React from 'react';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * AlertBanner Component
 * Sistema de alertas consistente con 4 tipos: info, warning, error, success
 * Colores optimizados para light y dark mode con contraste WCAG AA
 */

const alertStyles = {
  info: {
    light: 'bg-blue-50 border-blue-200 text-blue-900',
    dark: 'dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    IconComponent: Info
  },
  warning: {
    light: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    dark: 'dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400',
    IconComponent: AlertTriangle
  },
  error: {
    light: 'bg-red-50 border-red-200 text-red-900',
    dark: 'dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    IconComponent: AlertCircle
  },
  success: {
    light: 'bg-green-50 border-green-200 text-green-900',
    dark: 'dark:bg-green-950/30 dark:border-green-800 dark:text-green-100',
    icon: 'text-green-600 dark:text-green-400',
    IconComponent: CheckCircle
  }
};

export function AlertBanner({
  type = 'info',
  message,
  onDismiss,
  isDismissible = true
}) {
  const styles = alertStyles[type];
  const Icon = styles.IconComponent;

  return (
    <div
      className={`
        border-l-4 rounded-lg p-4
        flex items-start gap-3
        ${styles.light} ${styles.dark}
      `}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icono */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true" />

      {/* Mensaje */}
      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      {/* Botón cerrar */}
      {isDismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg
                     hover:bg-black/5 dark:hover:bg-white/5
                     transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
