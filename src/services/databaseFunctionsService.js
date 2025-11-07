import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, ensureScopedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * Servicio para funciones de base de datos de Supabase
 * Estas funciones son SECURITY DEFINER y manejan lógica compleja del backend
 */

/**
 * Aprueba una requisición.
 * Usa la función de base de datos approve_requisition.
 * @param {string} requisitionId - ID de la requisición.
 * @param {string} comments - Comentarios opcionales del aprobador.
 * @returns {Promise<Object>} Resultado de la aprobación.
 */
export const approveRequisition = async (requisitionId, comments = null) => {
  if (!requisitionId) {
    throw new Error("El ID de la requisición es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase.rpc('approve_requisition', {
    p_requisition_id: requisitionId,
    p_comments: comments
  });

  if (error) {
    logger.error('Error approving requisition:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Rechaza una requisición.
 * Usa la función de base de datos reject_requisition.
 * @param {string} requisitionId - ID de la requisición.
 * @param {string} reason - Razón del rechazo.
 * @returns {Promise<Object>} Resultado del rechazo.
 */
export const rejectRequisition = async (requisitionId, reason) => {
  if (!requisitionId) {
    throw new Error("El ID de la requisición es requerido.");
  }

  if (!reason || !reason.trim()) {
    throw new Error("La razón del rechazo es requerida.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase.rpc('reject_requisition', {
    p_requisition_id: requisitionId,
    p_reason: reason.trim()
  });

  if (error) {
    logger.error('Error rejecting requisition:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Envía una requisición para aprobación.
 * Usa la función de base de datos submit_requisition.
 * @param {string} requisitionId - ID de la requisición.
 * @returns {Promise<Object>} Resultado del envío.
 */
export const submitRequisition = async (requisitionId) => {
  if (!requisitionId) {
    throw new Error("El ID de la requisición es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase.rpc('submit_requisition', {
    p_requisition_id: requisitionId
  });

  if (error) {
    logger.error('Error submitting requisition:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Usa una plantilla de requisición para crear una nueva requisición.
 * Usa la función de base de datos use_requisition_template.
 * @param {string} templateId - ID de la plantilla.
 * @returns {Promise<string>} ID de la requisición creada.
 */
export const useRequisitionTemplate = async (templateId) => {
  if (!templateId) {
    throw new Error("El ID de la plantilla es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase.rpc('use_requisition_template', {
    p_template_id: templateId
  });

  if (error) {
    logger.error('Error using requisition template:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Limpia el carrito del usuario actual.
 * Usa la función de base de datos clear_user_cart.
 * @returns {Promise<Object>} Resultado de la operación.
 */
export const clearUserCart = async () => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase.rpc('clear_user_cart');

  if (error) {
    logger.error('Error clearing user cart:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Obtiene las categorías únicas de productos para la compañía actual.
 * Usa la función de base de datos get_unique_product_categories.
 * @returns {Promise<Array>} Lista de categorías.
 */
export const getUniqueProductCategories = async () => {
  const { companyId, error: companyError } = await ensureScopedCompanyId();
  if (companyError || !companyId) {
    throw new Error(companyError?.message || "No se pudo seleccionar la empresa objetivo.");
  }

  // Optimizado: Usar el parámetro correcto del RPC y el helper cacheado
  const { data, error } = await supabase.rpc('get_unique_product_categories', {
    company_id_param: companyId
  });

  if (error) {
    logger.error('Error fetching product categories:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data || [];
};

/**
 * Transmite un evento a todos los usuarios de la compañía.
 * Usa la función de base de datos broadcast_to_company.
 * @param {string} eventName - Nombre del evento.
 * @param {Object} payload - Datos del evento.
 * @returns {Promise<void>}
 */
export const broadcastToCompany = async (eventName, payload) => {
  if (!eventName || !eventName.trim()) {
    throw new Error("El nombre del evento es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { error } = await supabase.rpc('broadcast_to_company', {
    event_name: eventName.trim(),
    payload: payload || {}
  });

  if (error) {
    logger.error('Error broadcasting to company:', error);
    throw new Error(formatErrorMessage(error));
  }
};
