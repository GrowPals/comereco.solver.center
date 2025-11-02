
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los perfiles de usuario de la compañía actual.
 * RLS filtra automáticamente por company_id según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Una lista de perfiles de usuario.
 */
export const fetchUsersInCompany = async () => {
  // Validar sesión antes de hacer queries (usando cache)
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Optimizado: Usar helper cacheado para obtener company_id
  const { companyId, error: companyError } = await getCachedCompanyId();
  if (companyError || !companyId) {
    logger.error("Error fetching current user's company", companyError);
    return [];
  }

  // RLS filtra automáticamente por company_id, pero el filtro explícito añade claridad
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
    .eq('company_id', companyId);

  if (error) {
    logger.error('Error fetching users in company', error);
    throw new Error(formatErrorMessage(error));
  }
  return data || [];
};

/**
 * CORREGIDO: Valida sesión y maneja errores correctamente
 * Invita a un nuevo usuario a la compañía.
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

    // Optimizado: Usar helpers cacheados
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Usuario no autenticado.");
    }

    const { companyId, error: companyError } = await getCachedCompanyId();
    if (companyError || !companyId) {
        throw new Error('No se pudo obtener la información de la compañía.');
    }

    // Validar que el rol sea válido según REFERENCIA_TECNICA_BD_SUPABASE.md
    const validRoles = ['admin', 'supervisor', 'user'];
    if (!validRoles.includes(role)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }

    // FIX: La llamada correcta es a `supabase.auth.admin.inviteUserByEmail`
    // FIX: Los metadatos deben estar dentro de `user_metadata`
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
        data: {
            // Esto se usará en el trigger handle_new_user para crear el perfil
            role_v2: role, 
            company_id: companyId,
        },
    });

    if (error) {
        logger.error('Error inviting user:', error);
        // Manejar errores específicos
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
            throw new Error("Este email ya está registrado en el sistema.");
        }
        throw new Error(formatErrorMessage(error));
    }

    return data;
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

  // Campos permitidos según REFERENCIA_TECNICA_BD_SUPABASE.md
  const allowedFields = ['full_name', 'avatar_url', 'role_v2'];
  const filteredUpdate = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      // Limpiar y normalizar datos
      if (key === 'full_name' && updateData[key]) {
        obj[key] = updateData[key].trim();
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
    .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
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
