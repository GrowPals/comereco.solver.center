
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
/**
 * CORREGIDO: Valida sesión y evita embeds ambiguos
 * RLS filtra automáticamente según el rol del usuario
 */
export const fetchRequisitions = async (page = 1, pageSize = 10, sortBy = 'created_at', ascending = false) => {
    // Validar sesión antes de hacer queries
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // CORREGIDO: Según documentación técnica oficial, el campo es created_by (no requester_id)
    // Hacer joins explícitos para evitar ambigüedades según mejores prácticas
    const { data, error, count } = await supabase
        .from('requisitions')
        .select(`
            id,
            internal_folio,
            created_at,
            total_amount,
            business_status,
            integration_status,
            project_id,
            created_by,
            approved_by,
            company_id
        `, { count: 'exact' })
        .order(sortBy, { ascending })
        .range(from, to);

    if (error) {
        logger.error("Error fetching requisitions:", error);
        throw new Error("No se pudieron cargar las requisiciones.");
    }

    // Enriquecer con datos de proyecto y creador si es necesario
    // Evitar embeds ambiguos usando consultas separadas
    const enrichedData = await Promise.all(
        (data || []).map(async (req) => {
            let project = null;
            let creator = null;

            if (req.project_id) {
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('id, name, description, status')
                    .eq('id', req.project_id)
                    .single();
                project = projectData;
            }

            if (req.created_by) {
                const { data: creatorData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role_v2')
                    .eq('id', req.created_by)
                    .single();
                creator = creatorData;
            }

            return {
                ...req,
                project,
                creator
            };
        })
    );

    return { data: enrichedData, total: count };
};

/**
 * Obtiene el detalle de una requisición específica.
 * @param {string} id - ID de la requisición.
 * @returns {Promise<object>} Detalle de la requisición.
 */
export const fetchRequisitionDetails = async (id) => {
    // FIX: Evitar embeds ambiguos - consultas separadas según REFERENCIA_TECNICA_BD_SUPABASE.md
    // Primero obtener la requisición base
    const { data: requisition, error: reqError } = await supabase
        .from('requisitions')
        .select('*')
        .eq('id', id)
        .single();

    if (reqError) {
        logger.error("Error fetching requisition details:", reqError);
        throw new Error("No se pudo cargar el detalle de la requisición.");
    }

    // Obtener items de la requisición
    const { data: items, error: itemsError } = await supabase
        .from('requisition_items')
        .select('id, product_id, quantity, unit_price, subtotal')
        .eq('requisition_id', id);

    if (itemsError) {
        logger.error("Error fetching requisition items:", itemsError);
    }

    // Obtener productos para los items
    const productIds = items?.map(item => item.product_id).filter(Boolean) || [];
    let productsMap = {};
    if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, sku, image_url, unit')
            .in('id', productIds);

        if (!productsError && products) {
            productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
    }

    // Obtener información del proyecto si existe
    let project = null;
    if (requisition.project_id) {
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', requisition.project_id)
            .single();
        
        if (!projectError && projectData) {
            project = projectData;
        }
    }

    // Obtener información del creador - campo correcto según documentación: created_by
    let creator = null;
    if (requisition.created_by) {
        const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role_v2')
            .eq('id', requisition.created_by)
            .single();
        
        if (!creatorError && creatorData) {
            creator = creatorData;
        }
    }

    // Obtener información del aprobador si existe
    let approver = null;
    if (requisition.approved_by) {
        const { data: approverData, error: approverError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role_v2')
            .eq('id', requisition.approved_by)
            .single();
        
        if (!approverError && approverData) {
            approver = approverData;
        }
    }

    // Combinar datos
    return {
        ...requisition,
        project,
        creator,
        approver,
        items: items?.map(item => ({
            ...item,
            product: productsMap[item.product_id] || null
        })) || []
    };
};


/**
 * Llama al RPC para crear una requisición completa desde el carrito.
 * @param {object} requisitionData - { projectId, comments, items }
 * @returns {Promise<object>} La nueva requisición creada.
 */
export const createRequisitionFromCart = async ({ projectId, comments, items }) => {
    if (!projectId) throw new Error("El proyecto es requerido.");
    if (!items || items.length === 0) throw new Error("No se puede crear una requisición sin productos.");

    // Transformar items del carrito al formato esperado por el RPC
    const rpcItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
    }));

    const { data, error } = await supabase.rpc('create_full_requisition', {
        p_project_id: projectId,
        p_comments: comments || '',
        p_items: rpcItems,
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
    // CORREGIDO: Usar created_by según REFERENCIA_TECNICA_BD_SUPABASE.md
    const { data: requisitions, error } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, total_amount, project_id, created_by')
        .eq('business_status', 'submitted')
        .order('created_at', { ascending: true });
    
    if (error) {
        logger.error('Error fetching pending approvals:', error);
        throw new Error('No se pudieron cargar las aprobaciones pendientes.');
    }

    // Enriquecer con datos de proyecto y creador
    const enrichedRequisitions = await Promise.all(
        (requisitions || []).map(async (req) => {
            let project = null;
            let creator = null;

            if (req.project_id) {
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('name')
                    .eq('id', req.project_id)
                    .single();
                project = projectData;
            }

            if (req.created_by) {
                const { data: creatorData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role_v2')
                    .eq('id', req.created_by)
                    .single();
                creator = creatorData;
            }

            return {
                ...req,
                project,
                creator
            };
        })
    );

    return enrichedRequisitions;
};

/**
 * Envía una requisición para aprobación (cambia el estado a 'submitted').
 * @param {string} requisitionId - ID de la requisición.
 * @returns {Promise<object>} Requisición actualizada.
 */
export const submitRequisition = async (requisitionId) => {
    const { data, error } = await supabase
        .from('requisitions')
        .update({ 
            business_status: 'submitted',
            updated_at: new Date().toISOString()
        })
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
 * CORREGIDO: Agrega approved_by cuando se aprueba según documentación técnica
 * @param {string} requisitionId - ID de la requisición.
 * @param {string} status - Nuevo estado ('approved' o 'rejected').
 * @param {string} reason - Razón del rechazo (opcional).
 * @returns {Promise<object>} Requisición actualizada.
 */
export const updateRequisitionStatus = async (requisitionId, status, reason = null) => {
    // Obtener el usuario actual para approved_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Usuario no autenticado.');
    }

    const updateData = {
        business_status: status,
        updated_at: new Date().toISOString(),
    };

    // Según documentación: cuando se aprueba, se debe establecer approved_by
    if (status === 'approved') {
        updateData.approved_by = user.id;
    }

    // Si se rechaza, agregar razón y timestamp
    if (status === 'rejected') {
        if (reason) {
            updateData.rejection_reason = reason;
        }
        updateData.rejected_at = new Date().toISOString();
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
