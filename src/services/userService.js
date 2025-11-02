
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene todos los perfiles de usuario de la compañía actual.
 * @returns {Promise<Array>} Una lista de perfiles de usuario.
 */
export const fetchUsersInCompany = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (profileError || !profile) {
    logger.error("Error fetching current user's company", profileError);
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', profile.company_id);

  if (error) {
    logger.error('Error fetching users in company', error);
    throw new Error('No se pudieron cargar los usuarios.');
  }
  return data;
};

/**
 * Invita a un nuevo usuario a la compañía.
 * @param {string} email - El email del usuario a invitar.
 * @param {string} role - El rol a asignar al nuevo usuario (usará role_v2).
 * @returns {Promise<Object>} El resultado de la invitación.
 */
export const inviteUser = async (email, role) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (companyError) throw companyError;

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
        throw new Error(`No se pudo invitar al usuario: ${error.message}`);
    }

    return data;
};


/**
 * Actualiza los datos de un perfil de usuario.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {Object} updateData - Un objeto con los campos a actualizar (ej. { role_v2: 'admin' }).
 * @returns {Promise<Object>} El perfil de usuario actualizado.
 */
export const updateUserProfile = async (userId, updateData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    logger.error('Error updating user profile', error);
    throw new Error('No se pudo actualizar el perfil del usuario.');
  }
  return data;
};
