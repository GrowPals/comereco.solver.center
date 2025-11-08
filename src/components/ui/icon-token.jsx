import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { buildIconStyles } from './icon-presets';

export const IconToken = ({
  icon: Icon,
  size = 'md',
  tone = 'brand',
  variant = 'soft',
  glow = false,
  className,
  iconClassName,
  children,
  ...props
}) => {
  const { wrapper, icon } = buildIconStyles({
    size,
    tone,
    variant,
    glow,
    forceWrapper: true,
  });

  return (
    <span
      className={cn('icon-token flex items-center justify-center', wrapper, className)}
      {...props}
    >
      {children ?? (Icon ? <Icon aria-hidden="true" className={cn(icon, iconClassName)} /> : null)}
    </span>
  );
};

IconToken.propTypes = {
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  tone: PropTypes.oneOf(['brand', 'neutral', 'info', 'success', 'warning', 'danger']),
  variant: PropTypes.oneOf(['simple', 'soft', 'solid', 'outline', 'glass', 'ghost']),
  glow: PropTypes.bool,
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  children: PropTypes.node,
};

export default IconToken;
