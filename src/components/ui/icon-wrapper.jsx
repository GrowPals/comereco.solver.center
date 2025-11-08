import React from 'react';
import { Icon } from './icon';

/**
 * IconWrapper - Wrapper de retrocompatibilidad que usa el nuevo sistema Icon
 *
 * @deprecated Usar <Icon> directamente
 */
export function IconWrapper({ icon, variant = 'default', size = 'md', className, iconClassName, ...props }) {
  // Mapear variantes antiguas al nuevo sistema
  const variantMap = {
    soft: 'soft',
    solid: 'solid',
    simple: 'default',
    ghost: 'default',
    outline: 'soft',
    glass: 'soft',
    neutral: 'default',
  };

  const newVariant = variantMap[variant] || 'default';

  return (
    <Icon
      icon={icon}
      size={size}
      variant={newVariant}
      className={className}
      iconClassName={iconClassName}
      {...props}
    />
  );
}

export function StatIcon({ icon, size = 'lg', className, ...props }) {
  return <Icon icon={icon} variant="solid" size={size} className={className} {...props} />;
}

export function SectionIcon({ icon, size = 'md', className, ...props }) {
  return <Icon icon={icon} variant="soft" size={size} className={className} {...props} />;
}
