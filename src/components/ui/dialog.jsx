/**
 * Dialog Component - Modern Pastel Design System
 *
 * Modal dialogs limpios sin sombras pesadas
 * Usa backdrop blur y bordes sutiles
 */
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/40 backdrop-blur-sm',
      'dark:bg-black/60',
      'transition-all duration-200',
      'data-[state=open]:animate-fade-in',
      'data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position
        'fixed left-[50%] top-[50%] z-50',
        'translate-x-[-50%] translate-y-[-50%]',
        // Size
        'w-[calc(100%-1.5rem)] max-w-lg',
        'max-h-[calc(100dvh-2.5rem)]',
        // Layout
        'grid gap-4 p-6',
        'overflow-y-auto overscroll-contain',
        // Styling - sin sombras pesadas
        'rounded-2xl',
        'bg-card/95 backdrop-blur-xl',
        'border-2 border-border',
        'text-foreground',
        // Animations
        'duration-200',
        'data-[state=open]:animate-scale-in',
        'data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    >
      {children}

      {/* Close button */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4",
          "flex h-10 w-10 items-center justify-center",
          "rounded-xl",
          "bg-muted/50 text-muted-foreground",
          "transition-all duration-200",
          "hover:bg-muted hover:text-foreground",
          "hover:scale-105",
          "active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
          "cursor-pointer"
        )}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Cerrar diálogo</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-semibold leading-tight tracking-tight text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
