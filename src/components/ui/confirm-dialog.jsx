/**
 * ConfirmDialog Component
 * Diálogo de confirmación para acciones críticas con feedback visual mejorado
 */
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive', // 'destructive' | 'warning' | 'default'
  isLoading = false,
  onConfirm,
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 className="h-6 w-6 text-error" />,
          confirmButton: 'bg-error hover:bg-error/90 text-white focus:ring-error',
          titleColor: 'text-error',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-warning" />,
          confirmButton: 'bg-warning hover:bg-warning/90 text-white focus:ring-warning',
          titleColor: 'text-warning',
        };
      default:
        return {
          icon: <CheckCircle className="h-6 w-6 text-primary-500" />,
          confirmButton: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
          titleColor: 'text-primary-600',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              variant === 'destructive' && 'bg-error-light',
              variant === 'warning' && 'bg-warning-light',
              variant === 'default' && 'bg-primary-50'
            )}>
              {variantStyles.icon}
            </div>
            <AlertDialogTitle className={cn('text-xl font-semibold', variantStyles.titleColor)}>
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-neutral-600 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} className="focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200',
              variantStyles.confirmButton,
              isLoading && 'opacity-75 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;

