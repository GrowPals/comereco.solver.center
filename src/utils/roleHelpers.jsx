
import React from 'react';

export const ROLES = {
  ADMIN: 'admin_corp',
  SUPERVISOR: 'supervisor',
  USER: 'employee',
  SUPER_ADMIN: 'super_admin'
};

/**
 * Checks if a user has at least one of the specified roles.
 * @param {object} user - The user object from useSupabaseAuth.
 * @param {Array<string>} requiredRoles - Array of roles to check against.
 * @returns {boolean} - True if the user has one of the required roles.
 */
export const userHasRole = (user, requiredRoles) => {
  if (!user || !user.role || !Array.isArray(requiredRoles)) {
    return false;
  }
  return requiredRoles.includes(user.role);
};

/**
 * A Higher-Order Component to conditionally render children based on user roles.
 * @param {object} props
 * @param {React.ReactNode} props.children - The component/elements to render if authorized.
 * @param {object} props.user - The user object.
 * @param {Array<string>} props.allowedRoles - The roles that are allowed to see the content.
 * @returns {React.ReactNode|null}
 */
export const Can = ({ children, user, allowedRoles }) => {
  const isAllowed = userHasRole(user, allowedRoles);
  return isAllowed ? <>{children}</> : null;
};
