
import React from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Un hook personalizado para centralizar la lógica de permisos de usuario.
 * Proporciona booleanos fáciles de usar para verificar los roles y capacidades del usuario actual.
 * 
 * @returns {object} Un objeto que contiene:
 * - `userRole` (string): El rol del usuario ('admin', 'supervisor', 'user').
 * - `isSuperAdmin` (boolean): Verdadero si el usuario es Super Administrador.
 * - `isAdmin` (boolean): Verdadero si el usuario es Administrador de la compañía.
 * - `isSupervisor` (boolean): Verdadero si el usuario es Supervisor.
 * - `isUser` (boolean): Verdadero si el usuario tiene el rol base de usuario.
 * - `canManageUsers` (boolean): Si el usuario puede gestionar (invitar, editar) otros usuarios.
 * - `canManageProjects` (boolean): Si el usuario puede crear/editar proyectos.
 * - `canApproveRequisitions` (boolean): Si el usuario puede aprobar o rechazar requisiciones.
 * - `isLoadingPermissions` (boolean): Verdadero mientras se carga la información del usuario.
 */
export const useUserPermissions = () => {
    const { user, loading } = useSupabaseAuth();

    // ⚠️ Usa role_v2 según la especificación, no 'role'
    const userRole = user?.role_v2;

    // Roles directos
    const isSuperAdmin = userRole === 'super_admin';
    const isAdmin = userRole === 'admin';
    const isSupervisor = userRole === 'supervisor';
    const isUser = userRole === 'user';
    
    // Capacidades basadas en roles
    const canManageUsers = isSuperAdmin || isAdmin;
    const canManageProjects = isSuperAdmin || isAdmin;
    const canApproveRequisitions = isSuperAdmin || isAdmin || isSupervisor;

    return {
        userRole,
        isSuperAdmin,
        isAdmin,
        isSupervisor,
        isUser,
        canManageUsers,
        canManageProjects,
        canApproveRequisitions,
        isLoadingPermissions: loading,
    };
};
