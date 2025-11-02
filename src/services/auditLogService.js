import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * Servicio para el log de auditoría (audit_log)
 * Solo disponible para administradores corporativos y super administradores
 * Registra todas las acciones importantes del sistema
 */

/**
 * Obtiene el log de auditoría.
 * Solo disponible para admins.
 * @param {Object} filters - Filtros opcionales.
 * @param {string} filters.company_id - Filtrar por empresa.
 * @param {string} filters.user_id - Filtrar por usuario.
 * @param {string} filters.event_name - Filtrar por nombre de evento.
 * @param {Date} filters.start_date - Fecha de inicio.
 * @param {Date} filters.end_date - Fecha de fin.
 * @param {number} page - Página actual (default: 1).
 * @param {number} pageSize - Tamaño de página (default: 50).
 * @returns {Promise<Object>} Log de auditoría con paginación.
 */
export const fetchAuditLog = async (filters = {}, page = 1, pageSize = 50) => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('audit_log')
    .select('id, company_id, user_id, event_name, payload, timestamp', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(from, to);

  // Aplicar filtros
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.event_name) {
    query = query.eq('event_name', filters.event_name);
  }

  if (filters.start_date) {
    query = query.gte('timestamp', filters.start_date.toISOString());
  }

  if (filters.end_date) {
    query = query.lte('timestamp', filters.end_date.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error fetching audit log:', error);
    throw new Error(formatErrorMessage(error));
  }

  // Enriquecer con información de usuarios si es necesario
  const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))];
  let usersMap = {};
  
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    
    if (users) {
      users.forEach(u => { usersMap[u.id] = u; });
    }
  }

  // Enriquecer con información de empresas si es necesario
  const companyIds = [...new Set((data || []).map(log => log.company_id).filter(Boolean))];
  let companiesMap = {};
  
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds);
    
    if (companies) {
      companies.forEach(c => { companiesMap[c.id] = c; });
    }
  }

  // Enriquecer datos
  const enrichedData = (data || []).map(log => ({
    ...log,
    user: log.user_id ? usersMap[log.user_id] : null,
    company: log.company_id ? companiesMap[log.company_id] : null,
  }));

  return {
    data: enrichedData,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

/**
 * Obtiene eventos de auditoría por tipo.
 * @param {string} eventName - Nombre del evento (ej: 'requisition.created').
 * @param {number} limit - Límite de resultados (default: 100).
 * @returns {Promise<Array>} Lista de eventos.
 */
export const fetchAuditLogByEvent = async (eventName, limit = 100) => {
  if (!eventName || !eventName.trim()) {
    throw new Error("El nombre del evento es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, company_id, user_id, event_name, payload, timestamp')
    .eq('event_name', eventName.trim())
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching audit log by event:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data || [];
};

/**
 * Obtiene estadísticas del log de auditoría.
 * @param {Date} startDate - Fecha de inicio.
 * @param {Date} endDate - Fecha de fin.
 * @returns {Promise<Object>} Estadísticas del log.
 */
export const getAuditLogStats = async (startDate = null, endDate = null) => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  let query = supabase
    .from('audit_log')
    .select('event_name, timestamp', { count: 'exact' });

  if (startDate) {
    query = query.gte('timestamp', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('timestamp', endDate.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error fetching audit log stats:', error);
    throw new Error(formatErrorMessage(error));
  }

  // Agrupar por evento
  const eventsMap = {};
  (data || []).forEach(log => {
    if (!eventsMap[log.event_name]) {
      eventsMap[log.event_name] = 0;
    }
    eventsMap[log.event_name]++;
  });

  return {
    total: count || 0,
    byEvent: eventsMap,
    events: Object.keys(eventsMap).map(eventName => ({
      name: eventName,
      count: eventsMap[eventName]
    })).sort((a, b) => b.count - a.count)
  };
};

