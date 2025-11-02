
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene todas las requisiciones. La RLS de Supabase filtra según el rol.
 * @param {number} page - Página actual (default: 1)
 * @param {number} pageSize - Tamaño de la página (default: 10)
 * @param {string} sortBy - Campo de ordenamiento (default: 'created_at')
 * @param {boolean} ascending - Dirección de ordenamiento (default: false)
 * @returns {Promise<Array>} Lista de requisiciones.
 */
export const fetchRequisitions = async (page = 1, pageSize = 10, sortBy = 'created_at', ascending = false) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from('requisitions')
        .select(`
            id,
            internal_folio,
            created_at,
            total_amount,
            business_status,
            project:project_id ( name ),
            creator:created_by ( full_name, avatar_url )
        `, { count: 'exact' })
        .order(sortBy, { ascending })
        .range(from, to);

    if (error) {
        logger.error("Error fetching requisitions:", error);
        throw new Error("No se pudieron cargar las requisiciones.");
    }
    return { data, total: count };
};

/**
 * Obtiene el detalle de una requisición específica.
 * @param {string} id - ID de la requisición.
 * @returns {Promise<object>} Detalle de la requisición.
 */
export const fetchRequisitionDetails = async (id) => {
    const { data, error } = await supabase
        .from('requisitions')
        .select(`
            *,
            project:project_id ( id, name ),
            creator:created_by ( id, full_name, avatar_url ),
            approver:approved_by ( id, full_name, avatar_url ),
            items:requisition_items (
                id,
                quantity,
                unit_price,
                subtotal,
                product:products (id, name, sku, image_url)
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        logger.error("Error fetching requisition details:", error);
        throw new Error("No se pudo cargar el detalle de la requisición.");
    }
    return data;
};


/**
 * Llama al RPC para crear una requisición completa desde el carrito.
 * @param {object} requisitionData - { projectId, comments, items }
 * @returns {Promise<object>} La nueva requisición creada.
 */
export const createRequisitionFromCart = async ({ projectId, comments, items }) => {
    if (!projectId) throw new Error("El proyecto es requerido.");
    if (!items || items.length === 0) throw new Error("No se puede crear una requisición sin productos.");

    const { data, error } = await supabase.rpc('create_full_requisition', {
        p_project_id: projectId,
        p_comments: comments,
        p_items: items,
    });
    
    if (error) {
        logger.error('Error in create_full_requisition RPC:', error);
        throw new Error(error.message || 'Error al crear la requisición.');
    }

    // El RPC devuelve el ID, hacemos una consulta para obtener el objeto completo
    const { data: newRequisition, error: fetchError } = await supabase
        .from('requisitions')
        .select('id, internal_folio')
        .eq('id', data)
        .single();
    
    if (fetchError) {
         logger.error('Error fetching new requisition after creation:', fetchError);
         throw new Error('La requisición fue creada pero no se pudo recuperar.');
    }

    // Limpiar el carrito del usuario después de crear la requisición
    const { error: cartError } = await supabase.rpc('clear_user_cart');
    if (cartError) {
        logger.error('Error clearing user cart:', cartError);
        // No lanzamos error aquí para no confundir al usuario, solo log.
    }

    return newRequisition;
};

/**
 * Obtiene las requisiciones pendientes de aprobación para el supervisor.
 * @returns {Promise<Array>} Lista de requisiciones pendientes.
 */
export const fetchPendingApprovals = async () => {
    const { data, error } = await supabase
        .from('requisitions')
        .select(`
            id,
            internal_folio,
            created_at,
            total_amount,
            project:project_id ( name ),
            creator:created_by ( full_name, avatar_url )
        `)
        .eq('business_status', 'submitted')
        .order('created_at', { ascending: true });
    
    if (error) {
        logger.error('Error fetching pending approvals:', error);
        throw new Error('No se pudieron cargar las aprobaciones pendientes.');
    }
    return data;
};

/**
 * Envía una requisición para aprobación (cambia el estado a 'submitted').
 * @param {string} requisitionId - ID de la requisición.
 * @returns {Promise<object>} Requisición actualizada.
 */
export const submitRequisition = async (requisitionId) => {
    const { data, error } = await supabase
        .from('requisitions')
        .update({ business_status: 'submitted' })
        .eq('id', requisitionId)
        .select()
        .single();

    if (error) {
        logger.error('Error submitting requisition:', error);
        throw new Error('No se pudo enviar la requisición.');
    }
    return data;
};

/**
 * Actualiza el estado de una requisición (aprobación/rechazo).
 * @param {string} requisitionId - ID de la requisición.
 * @param {string} status - Nuevo estado ('approved' o 'rejected').
 * @param {string} reason - Razón del rechazo (opcional).
 * @returns {Promise<object>} Requisición actualizada.
 */
export const updateRequisitionStatus = async (requisitionId, status, reason = null) => {
    const updateData = {
        business_status: status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
    }

    const { data, error } = await supabase
        .from('requisitions')
        .update(updateData)
        .eq('id', requisitionId)
        .select()
        .single();

    if (error) {
        logger.error('Error updating requisition status:', error);
        throw new Error(`No se pudo ${status === 'approved' ? 'aprobar' : 'rechazar'} la requisición.`);
    }
    return data;
};
