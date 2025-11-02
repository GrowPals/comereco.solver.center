
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
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

  // Obtener company_id del perfil actual
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile) {
    logger.error("Error fetching current user's company", profileError);
    return [];
  }

  // RLS filtra automáticamente por company_id, pero el filtro explícito añade claridad
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
    .eq('company_id', profile.company_id);

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
    // Validar sesión antes de hacer queries
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Usuario no autenticado.");
    }

    // Validar que el rol sea válido según REFERENCIA_TECNICA_BD_SUPABASE.md
    const validRoles = ['admin', 'supervisor', 'user'];
    if (!validRoles.includes(role)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }

    const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (companyError || !companyData) {
        logger.error('Error fetching company data:', companyError);
        throw new Error('No se pudo obtener la información de la compañía.');
    }

    // FIX: La llamada correcta es a `supabase.auth.admin.inviteUserByEmail`
    // FIX: Los metadatos deben estar dentro de `user_metadata`
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
            // Esto se usará en el trigger handle_new_user para crear el perfil
            role_v2: role, 
            company_id: companyData.company_id,
        },
    });

    if (error) {
        logger.error('Error inviting user:', error);
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

  // Campos permitidos según REFERENCIA_TECNICA_BD_SUPABASE.md
  const allowedFields = ['full_name', 'avatar_url', 'role_v2'];
  const filteredUpdate = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  const { data, error } = await supabase
    .from('profiles')
    .update(filteredUpdate)
    .eq('id', userId)
    .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
    .single();
  
  if (error) {
    logger.error('Error updating user profile', error);
    throw new Error(formatErrorMessage(error));
  }
  return data;
};
