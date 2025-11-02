
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';

/**
 * CORREGIDO: Valida sesión y usa RLS correctamente
 * Obtiene todas las notificaciones para el usuario autenticado.
 * RLS filtra automáticamente por user_id, pero el filtro explícito no es incorrecto.
 * @returns {Promise<Array>} Una lista de notificaciones.
 */
export const getNotifications = async () => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // RLS filtra automáticamente por user_id según REFERENCIA_TECNICA_BD_SUPABASE.md
    // El filtro explícito es redundante pero añade claridad
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    throw new Error('No se pudieron cargar las notificaciones.');
  }
};

/**
 * Obtiene el contador de notificaciones no leídas para el usuario autenticado.
 * @returns {Promise<number>} Número de notificaciones no leídas.
 */
export const getUnreadCount = async () => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      return 0;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Marca una o más notificaciones como leídas.
 * @param {Array<string>} ids - Un array de IDs de notificaciones.
 * @returns {Promise<void>}
 */
export const markNotificationsAsRead = async (ids) => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // RLS asegura que solo se pueden actualizar notificaciones propias
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    throw new Error('No se pudieron marcar las notificaciones como leídas.');
  }
};

/**
 * Marca una o más notificaciones como no leídas.
 * @param {Array<string>} ids - Un array de IDs de notificaciones.
 * @returns {Promise<void>}
 */
export const markNotificationsAsUnread = async (ids) => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // RLS asegura que solo se pueden actualizar notificaciones propias
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    logger.error('Error marking notifications as unread:', error);
    throw new Error('No se pudieron marcar las notificaciones como no leídas.');
  }
};

/**
 * Elimina una o más notificaciones.
 * @param {Array<string>} ids - Un array de IDs de notificaciones.
 * @returns {Promise<void>}
 */
export const deleteNotifications = async (ids) => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // RLS asegura que solo se pueden eliminar notificaciones propias
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting notifications:', error);
    throw new Error('No se pudieron eliminar las notificaciones.');
  }
};

/**
 * Crea una notificación para un usuario específico.
 * Solo puede ser llamada por usuarios autenticados con permisos adecuados.
 * 
 * @param {Object} notification - Datos de la notificación
 * @param {string} notification.user_id - ID del usuario que recibirá la notificación
 * @param {string} notification.company_id - ID de la compañía
 * @param {string} notification.type - Tipo: 'success', 'warning', 'danger', 'info'
 * @param {string} notification.title - Título de la notificación
 * @param {string} [notification.message] - Mensaje opcional
 * @param {string} [notification.link] - Link opcional para redirección
 * @returns {Promise<Object>} La notificación creada
 */
export const createNotification = async ({ user_id, company_id, type, title, message, link }) => {
  try {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // Validar tipos de notificación permitidos
    const validTypes = ['success', 'warning', 'danger', 'info'];
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de notificación inválido. Tipos permitidos: ${validTypes.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        company_id,
        type,
        title,
        message: message || null,
        link: link || null,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw new Error('No se pudo crear la notificación.');
  }
};
