
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import { getUserAccessContext } from '@/lib/accessControl';
import { scopeToCompany } from '@/lib/companyScope';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';
import { retryEdgeFunction } from '@/lib/retryHelper';

const PROFILE_BASE_FIELDS = [
  'id',
  'company_id',
  'full_name',
  'avatar_url',
  'role_v2',
  'is_active',
  'updated_at',
];
const UNDEFINED_COLUMN_CODE = '42703';
let supportsApprovalBypassFlag = true;
let supportsProfileEmail = true;
const APP_ROLE_V2_VALUES = ['admin', 'supervisor', 'user', 'dev'];

export const isApprovalBypassSupported = () => supportsApprovalBypassFlag;
export const isProfileEmailSupported = () => supportsProfileEmail;

const buildProfileSelect = ({ includePhone = false } = {}) => {
  const fields = [...PROFILE_BASE_FIELDS];
  if (includePhone) {
    fields.push('phone');
  }
  if (supportsProfileEmail) {
    fields.push('email');
  }
  if (supportsApprovalBypassFlag) {
    fields.push('can_submit_without_approval');
  }
  return fields.join(', ');
};

const disableOptionalColumn = (message = '') => {
  if (!message) {
    return false;
  }

  if (supportsApprovalBypassFlag && message.includes('can_submit_without_approval')) {
    supportsApprovalBypassFlag = false;
    return true;
  }

  if (supportsProfileEmail && message.includes('email')) {
    supportsProfileEmail = false;
    return true;
  }

  return false;
};

const executeProfileQuery = async (configure, { includePhone = false, single = false } = {}) => {
  const run = async () => {
    let query = supabase.from('profiles').select(buildProfileSelect({ includePhone }));
    query = configure(query);
    if (single) {
      return await query.single();
    }
    return await query;
  };

  let result = await run();

  while (result?.error?.code === UNDEFINED_COLUMN_CODE) {
    const updated = disableOptionalColumn(result?.error?.message || '');
    if (!updated) {
      break;
    }
    result = await run();
  }

  return result;
};

const executeProfileUpdate = async (applyFilters, changes, { includePhone = true } = {}) => {
  const run = async () => {
    let query = supabase.from('profiles').update(changes);
    query = applyFilters(query);
    return await query.select(buildProfileSelect({ includePhone })).single();
  };

  let result = await run();

  while (result?.error?.code === UNDEFINED_COLUMN_CODE) {
    const updated = disableOptionalColumn(result?.error?.message || '');
    if (!updated) {
      break;
    }
    if (!supportsApprovalBypassFlag && Object.prototype.hasOwnProperty.call(changes, 'can_submit_without_approval')) {
      const { can_submit_without_approval, ...rest } = changes;
      changes = rest;
    }
    if (!changes || Object.keys(changes).length === 0) {
      return {
        data: null,
        error: {
          code: 'UNSUPPORTED_COLUMN',
          message: 'La base de datos aún no está actualizada para manejar envíos sin aprobación. Ejecuta las migraciones más recientes.',
        },
      };
    }
    result = await run();
  }

  return result;
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todos los perfiles de usuario de la compañía actual.
 * RLS filtra automáticamente por company_id según REFERENCIA_TECNICA_BD_SUPABASE.md
 * @returns {Promise<Array>} Una lista de perfiles de usuario.
 */
export const fetchUsersInCompany = async () => {
  const access = await getUserAccessContext();

  if (access.isAdmin) {
    if (!access.isDev && !access.companyId) {
      logger.error("Error fetching current user's company", 'company_id_missing');
      return [];
    }

    const { data, error } = await executeProfileQuery(
      (query) => scopeToCompany(query, access),
      { includePhone: true }
    );

    if (error) {
      logger.error('Error fetching users in company', error);
      throw new Error(formatErrorMessage(error));
    }
    return data || [];
  }

  if (access.isSupervisor) {
    const manageableIds = access.manageableUserIds || [];
    if (!manageableIds.length) {
      return [];
    }

    const { data, error } = await executeProfileQuery(
      (query) => scopeToCompany(query.in('id', manageableIds), access)
    );

    if (error) {
      logger.error('Error fetching manageable users', error);
      throw new Error(formatErrorMessage(error));
    }

    return data || [];
  }

  const { data, error } = await executeProfileQuery(
    (query) => query.eq('id', access.userId),
    { single: true }
  );

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
 * @param {string} role - El rol a asignar al nuevo usuario (usará role_v2). Valores: 'admin' | 'supervisor' | 'user' | 'dev'
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

    const normalizedRole = role.trim();

    // Optimizado: Usar helpers cacheados para validar sesión
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Usuario no autenticado.");
    }
    const access = await getUserAccessContext();
    if (!access.isAdmin) {
        throw new Error('No tienes permisos para invitar usuarios.');
    }

    const assignableRoles = access.isDev ? APP_ROLE_V2_VALUES : APP_ROLE_V2_VALUES.filter((roleName) => roleName !== 'dev');
    if (!assignableRoles.includes(normalizedRole)) {
        throw new Error(`Rol inválido. Debe ser uno de: ${assignableRoles.join(', ')}`);
    }

    const companyId = access.companyId;
    if (!companyId) {
        throw new Error("No se pudo determinar la empresa actual.");
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Registrar la invitación antes de llamar a la edge function
    const { error: invitationError } = await supabase
        .from('user_invitations')
        .insert([{
            email: normalizedEmail,
            company_id: companyId,
            role: normalizedRole,
            invited_by: session.user.id,
        }]);

    if (invitationError && invitationError.code !== '23505') {
        logger.error('Error registrando invitación:', invitationError);
        throw new Error(formatErrorMessage(invitationError));
    }

    try {
        // Llamar a la Edge Function con retry logic automático
        const result = await retryEdgeFunction(
            async () => {
                const { data, error } = await supabase.functions.invoke('invite-user', {
                    body: {
                        email: normalizedEmail,
                        role: normalizedRole,
                    },
                });

                if (error) {
                    logger.error('Error inviting user via Edge Function:', error);
                    throw error;
                }

                if (data?.error) {
                    logger.error('Edge Function returned error:', data.error);
                    // Si es un error de negocio, no reintentar
                    const businessError = new Error(data.error);
                    businessError.isBusinessError = true;
                    throw businessError;
                }

                return data;
            },
            {
                functionName: 'invite-user',
                maxRetries: 3,
                shouldRetry: (error) => {
                    // No reintentar errores de negocio
                    if (error.isBusinessError) return false;
                    // No reintentar errores de validación
                    if (error.message?.includes('already registered')) return false;
                    if (error.message?.includes('already exists')) return false;
                    if (error.message?.includes('permisos')) return false;
                    // Reintentar errores de red/infraestructura
                    return true;
                }
            }
        );

        logger.info('User invited successfully:', result);
        return result;
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

  const access = await getUserAccessContext();
  const isSelf = session.user.id === userId;
  const manageableIds = access.manageableUserIds || [];

  // Validar que role_v2 sea válido si se está actualizando
  if (updateData.role_v2) {
    const validRoles = access.isDev ? APP_ROLE_V2_VALUES : APP_ROLE_V2_VALUES.filter((value) => value !== 'dev');
    if (!validRoles.includes(updateData.role_v2)) {
      throw new Error(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }
    if (!access.isAdmin) {
      throw new Error('Solo los administradores pueden cambiar el rol.');
    }
  }

  if (!access.isAdmin) {
    if (access.isSupervisor) {
      if (!manageableIds.includes(userId) && !isSelf) {
        throw new Error('No tienes permisos para actualizar este usuario.');
      }
    } else if (!isSelf) {
      throw new Error('No tienes permisos para actualizar este usuario.');
    }
  }

  if (updateData.can_submit_without_approval !== undefined && !access.isAdmin) {
    if (!access.isSupervisor || (!manageableIds.includes(userId) && !isSelf)) {
      throw new Error('No tienes permisos para modificar este permiso.');
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
  const allowedFields = ['full_name', 'avatar_url', 'role_v2', 'phone', 'can_submit_without_approval'];
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
      } else if (key === 'can_submit_without_approval') {
        obj[key] = !!updateData[key];
      } else {
        obj[key] = updateData[key];
      }
      return obj;
    }, {});

  if (!supportsApprovalBypassFlag) {
    delete filteredUpdate.can_submit_without_approval;
  }

  if (Object.keys(filteredUpdate).length === 0) {
    throw new Error('No hay campos válidos para actualizar en esta versión del sistema.');
  }

  const { data, error } = await executeProfileUpdate(
    (query) => query.eq('id', userId),
    filteredUpdate,
    { includePhone: true }
  );
  
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
    // Llamar a la Edge Function con retry logic automático
    const result = await retryEdgeFunction(
      async () => {
        const { data, error } = await supabase.functions.invoke('toggle-user-status', {
          body: {
            userId,
            isActive,
          },
        });

        if (error) {
          logger.error('Error toggling user status via Edge Function:', error);
          throw error;
        }

        if (data?.error) {
          logger.error('Edge Function returned error:', data.error);
          // Si es un error de negocio, no reintentar
          const businessError = new Error(data.error);
          businessError.isBusinessError = true;
          throw businessError;
        }

        return data;
      },
      {
        functionName: 'toggle-user-status',
        maxRetries: 3,
        shouldRetry: (error) => {
          // No reintentar errores de negocio
          if (error.isBusinessError) return false;
          // No reintentar errores de validación
          if (error.message?.includes('desactivarte a ti mismo')) return false;
          if (error.message?.includes('permisos')) return false;
          // Reintentar errores de red/infraestructura
          return true;
        }
      }
    );

    logger.info('User status toggled successfully:', result);
    return result;
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
