
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * CORREGIDO: Valida sesión y usa RLS correctamente
 * Obtiene todas las notificaciones para el usuario autenticado.
 * RLS filtra automáticamente por user_id, pero el filtro explícito no es incorrecto.
 * @returns {Promise<Array>} Una lista de notificaciones.
 */
export const getNotifications = async () => {
  try {
    // Validar sesión antes de hacer queries
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
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
 * Marca una o más notificaciones como leídas.
 * @param {Array<string>} ids - Un array de IDs de notificaciones.
 * @returns {Promise<void>}
 */
export const markNotificationsAsRead = async (ids) => {
  try {
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
