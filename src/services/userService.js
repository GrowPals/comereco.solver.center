
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import { getUserAccessContext } from '@/lib/accessControl';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los perfiles de usuario de la compañía actual.
 * RLS filtra automáticamente por company_id según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Una lista de perfiles de usuario.
 */
export const fetchUsersInCompany = async () => {
  const access = await getUserAccessContext();

  if (access.isAdmin) {
    const { companyId, error: companyError } = await getCachedCompanyId();
    if (companyError || !companyId) {
      logger.error("Error fetching current user's company", companyError);
      return [];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, avatar_url, role_v2, phone, updated_at')
      .eq('company_id', companyId);

    if (error) {
      logger.error('Error fetching users in company', error);
      throw new Error(formatErrorMessage(error));
    }
    return data || [];
  }

  if (access.isSupervisor) {
    const manageableIds = new Set(access.manageableUserIds || []);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
      .eq('company_id', access.companyId);

    if (error) {
      logger.error('Error fetching manageable users', error);
      throw new Error(formatErrorMessage(error));
    }

    return (data || []).map((profile) => ({
      ...profile,
      is_manageable: manageableIds.has(profile.id),
    }));
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
    .eq('id', access.userId)
    .single();

  if (error) {
    logger.error('Error fetching current user profile:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data ? [data] : [];
};

/**
 * CORREGIDO: Usa Edge Function para invitar usuarios de forma segura
 * Invita a un nuevo usuario a la compañía mediante una Edge Function.
 * La Edge Function maneja la invitación con permisos de service_role.
 * @param {string} email - El email del usuario a invitar.
 * @param {string} role - El rol a asignar al nuevo usuario (usará role_v2). Valores: 'admin' | 'supervisor' | 'user'
 * @returns {Promise<Object>} El resultado de la invitación.
 */
export const inviteUser = async (email, role) => {
    // Validar datos de entrada
    if (!email || !email.trim()) {
        throw new Error("El email es requerido.");
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error("El formato del email no es válido.");
    }
    if (!role) {
        throw new Error("El rol es requerido.");
    }

    // Validar que el rol sea válido según REFERENCIA_TECNICA_BD_SUPABASE.md
    const validRoles = ['admin', 'supervisor', 'user'];
    if (!validRoles.includes(role)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }

    // Optimizado: Usar helpers cacheados para validar sesión
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Usuario no autenticado.");
    }

    try {
        // Llamar a la Edge Function con el token del usuario
        const { data, error } = await supabase.functions.invoke('invite-user', {
            body: {
                email: email.trim().toLowerCase(),
                role: role,
            },
        });

        if (error) {
            logger.error('Error inviting user via Edge Function:', error);
            throw new Error(error.message || 'Error al invitar usuario');
        }

        if (data?.error) {
            logger.error('Edge Function returned error:', data.error);
            throw new Error(data.error);
        }

        logger.info('User invited successfully:', data);
        return data;
    } catch (error) {
        logger.error('Exception inviting user:', error);

        // Manejar errores específicos
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
            throw new Error("Este email ya está registrado en el sistema.");
        }
        if (error.message?.includes('permisos')) {
            throw new Error("No tienes permisos para invitar usuarios.");
        }

        throw new Error(error.message || formatErrorMessage(error));
    }
};


/**
 * CORREGIDO: Valida sesión y valida campos según esquema
 * Actualiza los datos de un perfil de usuario.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {Object} updateData - Un objeto con los campos a actualizar (ej. { role_v2: 'admin', full_name: '...' }).
 * @returns {Promise<Object>} El perfil de usuario actualizado.
 */
export const updateUserProfile = async (userId, updateData) => {
  // Validar datos de entrada
  if (!userId) {
    throw new Error("El ID del usuario es requerido.");
  }
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error("No se proporcionaron datos para actualizar.");
  }

  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Validar que role_v2 sea válido si se está actualizando
  if (updateData.role_v2) {
    const validRoles = ['admin', 'supervisor', 'user'];
    if (!validRoles.includes(updateData.role_v2)) {
      throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }
  }

  // Validar formato de nombre si se está actualizando
  if (updateData.full_name !== undefined) {
    if (!updateData.full_name || !updateData.full_name.trim()) {
      throw new Error("El nombre completo no puede estar vacío.");
    }
    if (updateData.full_name.trim().length < 2) {
      throw new Error("El nombre completo debe tener al menos 2 caracteres.");
    }
  }

  // Validar formato de teléfono si se está actualizando
  if (updateData.phone !== undefined && updateData.phone !== null) {
    const trimmedPhone = updateData.phone.trim();
    // Permitir cadena vacía para eliminar el teléfono
    if (trimmedPhone && trimmedPhone.length > 0) {
      // Validar que contenga solo números, espacios, guiones, paréntesis y el símbolo +
      const phoneRegex = /^[+\d\s\-()]+$/;
      if (!phoneRegex.test(trimmedPhone)) {
        throw new Error("El formato del teléfono no es válido. Use solo números, espacios, guiones, paréntesis o +");
      }
      if (trimmedPhone.length < 7 || trimmedPhone.length > 20) {
        throw new Error("El teléfono debe tener entre 7 y 20 caracteres.");
      }
    }
  }

  // Campos permitidos según REFERENCIA_TECNICA_BD_SUPABASE.md + phone
  const allowedFields = ['full_name', 'avatar_url', 'role_v2', 'phone'];
  const filteredUpdate = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      // Limpiar y normalizar datos
      if (key === 'full_name' && updateData[key]) {
        obj[key] = updateData[key].trim();
      } else if (key === 'phone' && updateData[key] !== undefined) {
        // Permitir null o cadena vacía para eliminar el teléfono
        const trimmedPhone = updateData[key] ? updateData[key].trim() : '';
        obj[key] = trimmedPhone || null;
      } else {
        obj[key] = updateData[key];
      }
      return obj;
    }, {});

  if (Object.keys(filteredUpdate).length === 0) {
    throw new Error("No hay campos válidos para actualizar.");
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(filteredUpdate)
    .eq('id', userId)
    .select('id, company_id, full_name, avatar_url, role_v2, phone, updated_at')
    .single();
  
  if (error) {
    logger.error('Error updating user profile', error);
    if (error.code === 'PGRST116') { // Not found
      throw new Error("Usuario no encontrado.");
    }
    throw new Error(formatErrorMessage(error));
  }
  
  if (!data) {
    throw new Error("No se pudo actualizar el perfil del usuario.");
  }
  
  return data;
};

/**
 * Desactiva o activa un usuario mediante Edge Function
 * @param {string} userId - El ID del usuario a modificar
 * @param {boolean} isActive - Estado de activación (true = activo, false = desactivado)
 * @returns {Promise<Object>} El resultado de la operación
 */
export const toggleUserStatus = async (userId, isActive) => {
  // Validar datos de entrada
  if (!userId) {
    throw new Error("El ID del usuario es requerido.");
  }
  if (typeof isActive !== 'boolean') {
    throw new Error("El estado de activación debe ser un booleano.");
  }

  // Validar sesión
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Usuario no autenticado.");
  }

  try {
    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke('toggle-user-status', {
      body: {
        userId,
        isActive,
      },
    });

    if (error) {
      logger.error('Error toggling user status via Edge Function:', error);
      throw new Error(error.message || 'Error al cambiar el estado del usuario');
    }

    if (data?.error) {
      logger.error('Edge Function returned error:', data.error);
      throw new Error(data.error);
    }

    logger.info('User status toggled successfully:', data);
    return data;
  } catch (error) {
    logger.error('Exception toggling user status:', error);

    // Manejar errores específicos
    if (error.message?.includes('desactivarte a ti mismo')) {
      throw new Error("No puedes desactivarte a ti mismo.");
    }
    if (error.message?.includes('permisos')) {
      throw new Error("No tienes permisos para cambiar el estado de usuarios.");
    }

    throw new Error(error.message || formatErrorMessage(error));
  }
};

/**
 * NUEVO: Elimina un usuario de la compañía (desactiva pero no elimina de auth)
 * IMPORTANTE: Esta función solo desactiva el usuario, no lo elimina de auth.users
 * para mantener integridad referencial en requisiciones y otros datos históricos.
 * @param {string} userId - El ID del usuario a eliminar.
 * @returns {Promise<Object>} El resultado de la operación.
 */
export const deleteUser = async (userId) => {
    // Validar datos de entrada
    if (!userId) {
        throw new Error("El ID del usuario es requerido.");
    }

    // Validar sesión
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Usuario no autenticado.");
    }

    // Validar que el usuario no se está eliminando a sí mismo
    if (session.user.id === userId) {
        throw new Error("No puedes eliminar tu propia cuenta.");
    }

    // En lugar de eliminar, desactivamos el usuario y limpiamos datos sensibles
    // Esto mantiene la integridad referencial en requisiciones y otros datos históricos
    const { error } = await supabase
        .from('profiles')
        .update({ 
            is_active: false,
            full_name: 'Usuario Eliminado',
            phone: null,
            avatar_url: null
        })
        .eq('id', userId);

    if (error) {
        logger.error('Error deleting user:', error);
        throw new Error(formatErrorMessage(error));
    }

    logger.info('User deleted successfully (deactivated):', userId);
    return { message: 'Usuario eliminado correctamente' };
};
