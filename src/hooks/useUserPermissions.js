
import React from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Un hook personalizado para centralizar la lógica de permisos de usuario.
 * Proporciona booleanos fáciles de usar para verificar los roles y capacidades del usuario actual.
 * 
 * @returns {object} Un objeto que contiene:
 * - `userRole` (string): El rol del usuario ('admin', 'supervisor', 'user').
 * - `isAdmin` (boolean): Verdadero si el usuario es Administrador de la compañía.
 * - `isSupervisor` (boolean): Verdadero si el usuario es Supervisor.
 * - `isUser` (boolean): Verdadero si el usuario tiene el rol base de usuario.
 * - `canManageUsers` (boolean): Si el usuario puede gestionar (invitar, editar) otros usuarios.
 * - `canManageProjects` (boolean): Si el usuario puede crear/editar proyectos.
 * - `canApproveRequisitions` (boolean): Si el usuario puede aprobar o rechazar requisiciones.
 * - `canCreateRequisitions` (boolean): Si el usuario puede crear requisiciones (todos los usuarios autenticados).
 * - `isLoadingPermissions` (boolean): Verdadero mientras se carga la información del usuario.
 */
export const useUserPermissions = () => {
    const { user, loading } = useSupabaseAuth();

    // ⚠️ Usa role_v2 según la especificación, no 'role' (LEGACY)
    // FIX: role_v2 solo tiene: 'admin', 'supervisor', 'user' (NO 'super_admin')
    // Según REFERENCIA_TECNICA_BD_SUPABASE.md
    const userRole = user?.role_v2;

    // Roles directos según role_v2 (admin | supervisor | user)
    const isAdmin = userRole === 'admin';
    const isSupervisor = userRole === 'supervisor';
    const isUser = userRole === 'user';
    
    // Capacidades basadas en roles
    // FIX: Eliminado isSuperAdmin ya que 'super_admin' no existe en role_v2
    // Si necesitas funcionalidad de super admin, debe manejarse vía políticas RLS o campo adicional
    const canManageUsers = isAdmin;
    const canManageProjects = isAdmin || isSupervisor;
    const canApproveRequisitions = isAdmin || isSupervisor;
    const canManageRestockRules = isAdmin || isSupervisor;
    // Todos los usuarios autenticados pueden crear requisiciones
    const canCreateRequisitions = !!user;

    return {
        userRole,
        isAdmin,
        isSupervisor,
        isUser,
        canManageUsers,
        canManageProjects,
        canApproveRequisitions,
        canManageRestockRules,
        canCreateRequisitions,
        isLoadingPermissions: loading,
    };
};
