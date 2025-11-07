import React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-border/80 bg-[var(--surface-contrast)] px-4 py-3 text-base text-foreground shadow-xs ring-offset-background placeholder:text-neutral-400 transition-all duration-200',
        'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:shadow-[var(--focus-glow)] focus-visible:ring-0 dark:focus-visible:border-[rgba(124,188,255,0.7)]',
        'hover:border-neutral-300 dark:hover:border-[rgba(120,186,255,0.5)]',
        'dark:border-[rgba(90,150,230,0.35)] dark:bg-[#0f1a2d] dark:text-neutral-50 dark:placeholder:text-neutral-500',
        'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60 dark:disabled:bg-[rgba(16,32,60,0.8)]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };