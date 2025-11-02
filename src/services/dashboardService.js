
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * Obtiene las estadísticas del dashboard para el rol actual.
 * Llama a un RPC de Supabase que calcula las estadísticas de forma segura en el backend.
 * @returns {Promise<object>} Objeto con las estadísticas.
 */
export const getDashboardStats = async () => {
    // La función RPC 'get_dashboard_stats' se encargará de determinar el rol
    // y devolver las estadísticas adecuadas para el usuario que realiza la llamada.
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
        logger.error('Error fetching dashboard stats:', error);
        throw new Error(formatErrorMessage(error));
    }
    
    // El RPC devuelve un array con un solo objeto
    // Validar que data existe y tiene elementos
    if (!data || !Array.isArray(data) || data.length === 0) {
        logger.warn('Dashboard stats RPC returned empty result');
        return {
            total_requisitions: 0,
            pending_requisitions: 0,
            approved_requisitions: 0,
            total_amount: 0,
        };
    }
    
    return data[0] || {};
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
        .limit(5);

    if (error) {
        logger.error('Error fetching recent requisitions:', error);
        throw new Error(formatErrorMessage(error));
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
        .limit(5);

     if (error) {
        logger.error('Error fetching supervisor projects activity:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data || [];
};
