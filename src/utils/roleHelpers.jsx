
import React from 'react';

/**
 * Roles válidos según REFERENCIA_TECNICA_BD_SUPABASE.md
 * Usar role_v2, NO role (LEGACY)
 */
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user',
  DEV: 'dev',
};

/**
 * Checks if a user has at least one of the specified roles.
 * FIX: Usa role_v2 en lugar de role (LEGACY) según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @param {object} user - The user object from useSupabaseAuth.
 * @param {Array<string>} requiredRoles - Array of roles to check against.
 * @returns {boolean} - True if the user has one of the required roles.
 */
export const userHasRole = (user, requiredRoles) => {
  if (!user || !user.role_v2 || !Array.isArray(requiredRoles)) {
    return false;
  }
  return requiredRoles.includes(user.role_v2);
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
