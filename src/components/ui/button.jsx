
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-00)] disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary-50)] text-white shadow-button hover:bg-[var(--primary-60)] hover:shadow-button-hover active:bg-[var(--primary-70)]',
        secondary: 'bg-white border-2 border-[var(--primary-50)] text-[var(--primary-50)] hover:bg-[var(--primary-00)]',
        destructive: 'bg-[var(--danger-50)] text-white hover:bg-[var(--danger-hover)] shadow-[0_4px_12px_rgba(255,90,92,0.25)]',
        success: 'bg-[var(--success-50)] text-white hover:bg-[var(--success-hover)] shadow-[0_4px_12px_rgba(40,232,136,0.25)]',
        warning: 'bg-[var(--warning-50)] text-white hover:bg-[var(--warning-hover)] shadow-[0_4px_12px_rgba(255,173,59,0.25)]',
        outline: 'border-2 border-[var(--neutral-10)] bg-white shadow-card hover:bg-[var(--neutral-10)] hover:text-[var(--neutral-100)]',
        ghost: 'hover:bg-[var(--neutral-10)] hover:text-[var(--neutral-100)]',
        link: 'text-[var(--primary-50)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2.5',
        lg: 'h-14 rounded-xl px-8 py-4',
        icon: 'h-12 w-12 rounded-full',
        'icon-sm': 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={isLoading || props.disabled}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </Comp>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
