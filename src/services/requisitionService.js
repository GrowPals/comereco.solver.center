
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene una lista de requisiciones con filtros y paginación.
 * La lógica de permisos (RLS) de Supabase se encarga de filtrar por usuario/rol.
 * @param {object} options - Opciones de paginación.
 * @returns {Promise<{data: Array, count: number}>} Lista de requisiciones y conteo total.
 */
export const getRequisitions = async ({ page = 1, limit = 10 }) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // La consulta ahora pide ambos estados: 'business_status' y 'integration_status'
    let query = supabase
        .from('requisitions')
        .select(`
            id,
            internal_folio,
            business_status,
            integration_status,
            created_at,
            total_amount,
            requester:requester_id ( full_name, avatar_url )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
    
    const { data, error, count } = await query;
    if (error) {
        logger.error("Error al obtener requisiciones:", error);
        throw error;
    }

    return { data: data || [], count: count || 0 };
};


/**
 * Obtiene una requisición por su ID con todos sus detalles.
 * La seguridad (RLS) de Supabase asegura que el usuario solo puede ver lo que le corresponde.
 * @param {string} id - El UUID de la requisición.
 * @returns {Promise<object|null>} La requisición detallada.
 */
export const getRequisitionById = async (id) => {
    const { data, error } = await supabase
        .from('requisitions')
        .select(`
            *,
            requester:requester_id ( id, full_name, role ),
            company:company_id ( id, name ),
            items:requisition_items (
                *,
                product:product_id ( id, name, sku, image_url, unit )
            )
        `)
        .eq('id', id)
        .single();
    
    if (error) {
        logger.error('Error fetching requisition by ID:', error);
        // El código 'PGRST116' significa "no rows returned"
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data;
};

/**
 * Actualiza el estado de negocio de una requisición.
 * La lógica de transición y permisos está protegida por el trigger de la BD.
 * @param {string} requisitionId - El UUID de la requisición.
 * @param {string} newBusinessStatus - El nuevo estado de negocio.
 * @returns {Promise<object|null>} La requisición actualizada.
 */
export const updateRequisitionBusinessStatus = async (requisitionId, newBusinessStatus) => {
    const { data, error } = await supabase
        .from('requisitions')
        .update({ business_status: newBusinessStatus })
        .eq('id', requisitionId)
        .select()
        .single();
    
    if (error) {
        logger.error('Error updating requisition status:', error.message);
        throw new Error(error.message);
    }
    
    return data;
};
