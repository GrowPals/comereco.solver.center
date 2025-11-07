
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { PAGINATION } from '@/constants/config';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * Obtiene las estadísticas del dashboard para el rol actual.
 * Llama a un RPC de Supabase que calcula las estadísticas de forma segura en el backend.
 * @returns {Promise<object>} Objeto con las estadísticas.
 */
export const getDashboardStats = async () => {
    try {
        // CRÍTICO: Validar sesión antes de llamar al RPC
        const { session, error: sessionError } = await getCachedSession();
        if (sessionError || !session) {
            logger.error('Dashboard stats failed: No valid session');
            // Devolver estadísticas vacías si no hay sesión válida
            return {
                draft_count: 0,
                submitted_count: 0,
                approved_count: 0,
                approved_total: 0,
                active_requisitions_count: 0,
                total_users_count: 0,
                total_projects_count: 0,
                total_requisitions: 0,
                pending_requisitions: 0,
                approved_requisitions: 0,
                total_amount: 0,
            };
        }

        // La función RPC 'get_dashboard_stats' se encargará de determinar el rol
        // y devolver las estadísticas adecuadas para el usuario que realiza la llamada.
        const { data, error } = await supabase.rpc('get_dashboard_stats');

        if (error) {
            logger.error('Error fetching dashboard stats:', error);
            // En lugar de lanzar error, devolver estadísticas vacías para que la UI se muestre
            return {
                draft_count: 0,
                submitted_count: 0,
                approved_count: 0,
                approved_total: 0,
                active_requisitions_count: 0,
                total_users_count: 0,
                total_projects_count: 0,
                total_requisitions: 0,
                pending_requisitions: 0,
                approved_requisitions: 0,
                total_amount: 0,
            };
        }

        // El RPC devuelve un array con un solo objeto
        // Validar que data existe y tiene elementos
        if (!data || !Array.isArray(data) || data.length === 0) {
            logger.warn('Dashboard stats RPC returned empty result');
            return {
                draft_count: 0,
                submitted_count: 0,
                approved_count: 0,
                approved_total: 0,
                active_requisitions_count: 0,
                total_users_count: 0,
                total_projects_count: 0,
                total_requisitions: 0,
                pending_requisitions: 0,
                approved_requisitions: 0,
                total_amount: 0,
            };
        }

        return data[0] || {};
    } catch (err) {
        logger.error('Exception in getDashboardStats:', err);
        // Devolver estadísticas vacías en caso de excepción
        return {
            draft_count: 0,
            submitted_count: 0,
            approved_count: 0,
            approved_total: 0,
            active_requisitions_count: 0,
            total_users_count: 0,
            total_projects_count: 0,
            total_requisitions: 0,
            pending_requisitions: 0,
            approved_requisitions: 0,
            total_amount: 0,
        };
    }
};

/**
 * Obtiene las requisiciones más recientes para el usuario actual.
 * @returns {Promise<Array>} Lista de requisiciones recientes.
 */
/**
 * CORREGIDO: Filtra por created_by del usuario actual según documentación técnica
 * Campo correcto: created_by (no requester_id)
 */
export const getRecentRequisitions = async () => {
    try {
        // Validar sesión antes de hacer queries (usando cache)
        const { session, error: sessionError } = await getCachedSession();
        if (sessionError || !session) {
            return [];
        }

        const { data, error } = await supabase
            .from('requisitions')
            .select('id, internal_folio, created_at, total_amount, business_status, project_id')
            .eq('created_by', session.user.id)
            .order('created_at', { ascending: false })
            .limit(PAGINATION.DASHBOARD_LIMIT);

        if (error) {
            logger.error('Error fetching recent requisitions:', error);
            // En lugar de lanzar error, devolver array vacío para que la UI se muestre
            return [];
        }

        // Optimizado: Enriquecer solo si hay datos y proyectos
        if (data && data.length > 0) {
            const projectIds = [...new Set(data.map(r => r.project_id).filter(Boolean))];
            if (projectIds.length > 0) {
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id, name')
                    .in('id', projectIds);

                if (projects) {
                    const projectsMap = new Map(projects.map(p => [p.id, p]));
                    data.forEach(req => {
                        req.project = req.project_id ? projectsMap.get(req.project_id) : null;
                    });
                }
            }
        }

        return data || [];
    } catch (err) {
        logger.error('Exception in getRecentRequisitions:', err);
        // Devolver array vacío en caso de excepción
        return [];
    }
};

/**
 * Obtiene los proyectos con actividad reciente para un supervisor.
 * Esta es una función de ejemplo; podría ser más compleja.
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getSupervisorProjectsActivity = async () => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        return [];
    }

    const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .limit(PAGINATION.DASHBOARD_LIMIT);

     if (error) {
        logger.error('Error fetching supervisor projects activity:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data || [];
};
