import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const toneClass = {
  primary: 'text-primary-600 dark:text-primary-100',
  neutral: 'text-neutral-600 dark:text-neutral-100',
  success: 'text-success dark:text-success-light',
  warning: 'text-warning dark:text-warning-light',
  danger: 'text-error dark:text-error-light',
};

export const IconToken = ({
  icon: Icon,
  size = 'md',
  tone = 'primary',
  className,
  children,
  ...props
}) => {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  return (
    <span
      className={cn(
        'icon-badge flex shrink-0 items-center justify-center',
        sizeMap[size],
        toneClass[tone],
        className
      )}
      {...props}
    >
      {children ?? <Icon aria-hidden="true" className={iconSizes[size]} />}
    </span>
  );
};

IconToken.propTypes = {
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  tone: PropTypes.oneOf(['primary', 'neutral', 'success', 'warning', 'danger']),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default IconToken;
