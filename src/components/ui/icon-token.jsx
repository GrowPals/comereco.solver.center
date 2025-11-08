import React from 'react';
import PropTypes from 'prop-types';
import { Icon as BaseIcon } from './icon';

export const IconToken = ({ icon, size = 'md', tone = 'primary', className, iconClassName, ...props }) => (
  <BaseIcon icon={icon} size={size} tone={tone} className={className} iconClassName={iconClassName} {...props} />
);

IconToken.propTypes = {
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  tone: PropTypes.oneOf(['primary', 'muted', 'success', 'warning', 'danger', 'info']),
  className: PropTypes.string,
  iconClassName: PropTypes.string,
};

export default IconToken;
