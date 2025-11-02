
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

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
        throw new Error('No se pudieron cargar las estadísticas del dashboard.');
    }
    
    // El RPC devuelve un array con un solo objeto
    return data[0];
};

/**
 * Obtiene las requisiciones más recientes para el usuario actual.
 * @returns {Promise<Array>} Lista de requisiciones recientes.
 */
export const getRecentRequisitions = async () => {
    const { data, error } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, total_amount, business_status, project:project_id(name)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        logger.error('Error fetching recent requisitions:', error);
        throw new Error('No se pudieron cargar las requisiciones recientes.');
    }
    return data;
};

/**
 * Obtiene los proyectos con actividad reciente para un supervisor.
 * Esta es una función de ejemplo; podría ser más compleja.
 * @returns {Promise<Array>} Lista de proyectos.
 */
export const getSupervisorProjectsActivity = async () => {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .limit(5);

     if (error) {
        logger.error('Error fetching supervisor projects activity:', error);
        throw new Error('No se pudo cargar la actividad de los proyectos.');
    }
    return data;
};
