import React from 'react';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
  '2xl': 'h-8 w-8',
};

const TONE_CLASS = 'text-primary-500 dark:text-primary-300';

const IconBadge = React.forwardRef(({ icon: Icon, className, size = 'md', ...props }, ref) => {
  if (!Icon) return null;

  return (
    <span ref={ref} className={cn('inline-flex items-center justify-center text-current', className)} {...props}>
      <Icon className={cn(SIZE_MAP[size] || SIZE_MAP.md, TONE_CLASS)} aria-hidden="true" />
    </span>
  );
});

IconBadge.displayName = 'IconBadge';

export { IconBadge };
