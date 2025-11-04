
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * Helper optimizado para enriquecer requisiciones con relaciones (proyectos, creadores, etc.)
 * Evita duplicación de código y mejora performance con batch queries
 */
const enrichRequisitionsWithRelations = async (requisitions, relations = ['project', 'creator']) => {
    if (!requisitions || requisitions.length === 0) return [];

    const projectIds = new Set();
    const creatorIds = new Set();

    // Recopilar IDs únicos
    requisitions.forEach(req => {
        if (req.project_id) projectIds.add(req.project_id);
        if (req.created_by) creatorIds.add(req.created_by);
    });

    // Batch queries paralelas para mejor performance
    const [projectsResult, creatorsResult] = await Promise.all([
        relations.includes('project') && projectIds.size > 0
            ? supabase.from('projects').select('id, name, description, status').in('id', [...projectIds])
            : Promise.resolve({ data: null }),
        relations.includes('creator') && creatorIds.size > 0
            ? supabase.from('profiles').select('id, full_name, avatar_url, role_v2').in('id', [...creatorIds])
            : Promise.resolve({ data: null })
    ]);

    // Crear maps para lookup rápido
    const projectsMap = new Map((projectsResult.data || []).map(p => [p.id, p]));
    const creatorsMap = new Map((creatorsResult.data || []).map(c => [c.id, c]));

    // Enriquecer datos
    return requisitions.map(req => ({
        ...req,
        project: req.project_id && relations.includes('project') 
            ? projectsMap.get(req.project_id) || null 
            : req.project || null,
        creator: req.created_by && relations.includes('creator')
            ? creatorsMap.get(req.created_by) || null
            : req.creator || null,
    }));
};

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
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
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
        throw new Error(formatErrorMessage(error));
    }

    // Optimizar: Enriquecer datos solo si hay requisiciones
    const enrichedData = (data || []).length > 0 
        ? await enrichRequisitionsWithRelations(data, ['project', 'creator'])
        : [];

    return { data: enrichedData || [], total: count || 0 };
};

/**
 * Obtiene el detalle de una requisición específica.
 * @param {string} id - ID de la requisición.
 * @returns {Promise<object>} Detalle de la requisición.
 */
export const fetchRequisitionDetails = async (id) => {
    // Validar que el ID sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
        throw new Error('ID de requisición inválido. Por favor, accede a la requisición desde la lista de requisiciones.');
    }

    // FIX: Evitar embeds ambiguos - consultas separadas según REFERENCIA_TECNICA_BD_SUPABASE.md
    // Primero obtener la requisición base
    // Optimizado: Seleccionar solo campos necesarios para evitar datos innecesarios
    const { data: requisition, error: reqError } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, updated_at, total_amount, comments, business_status, integration_status, project_id, created_by, approved_by, company_id, bind_folio, bind_synced_at, bind_error_message, bind_sync_attempts, approved_at, rejected_at, rejection_reason')
        .eq('id', id)
        .single();

    if (reqError) {
        logger.error("Error fetching requisition details:", reqError);
        throw new Error(formatErrorMessage(reqError));
    }
    
    if (!requisition) {
        throw new Error("Requisición no encontrada.");
    }

    // Obtener items de la requisición
    const { data: items, error: itemsError } = await supabase
        .from('requisition_items')
        .select('id, product_id, quantity, unit_price, subtotal')
        .eq('requisition_id', id);

    if (itemsError) {
        logger.error("Error fetching requisition items:", itemsError);
        // Continuar con items vacío si hay error, pero loguear el problema
    }

    // Obtener productos para los items (batch query)
    const productIds = items?.map(item => item.product_id).filter(Boolean) || [];
    let productsMap = {};
    if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, sku, image_url, unit')
            .in('id', productIds);

        if (productsError) {
            logger.error("Error fetching products for requisition items:", productsError);
            // Continuar sin productos si hay error (producto puede haber sido eliminado)
        } else if (products) {
            productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
    }

    // Optimizar: Batch queries para proyecto, creador y aprobador
    const relatedIds = {
        project: requisition.project_id ? [requisition.project_id] : [],
        creator: requisition.created_by ? [requisition.created_by] : [],
        approver: requisition.approved_by ? [requisition.approved_by] : []
    };

    const allProfileIds = [...new Set([...relatedIds.creator, ...relatedIds.approver])];
    
    // Batch query para perfiles (creador y aprobador)
    let profilesMap = {};
    if (allProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role_v2')
            .in('id', allProfileIds);
        
        if (!profilesError && profiles) {
            profiles.forEach(p => profilesMap[p.id] = p);
        }
    }

    // Batch query para proyectos
    let projectsMap = {};
    if (relatedIds.project.length > 0) {
        const { data: projects, error: projectError } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', relatedIds.project);
        
        if (!projectError && projects) {
            projects.forEach(p => projectsMap[p.id] = p);
        }
    }

    // Combinar datos
    return {
        ...requisition,
        project: requisition.project_id ? projectsMap[requisition.project_id] || null : null,
        creator: requisition.created_by ? profilesMap[requisition.created_by] || null : null,
        approver: requisition.approved_by ? profilesMap[requisition.approved_by] || null : null,
        items: items?.map(item => ({
            ...item,
            product: productsMap[item.product_id] || null
        })) || []
    };
};


/**
 * Alias legacy para compatibilidad (DEPRECATED - usar createRequisitionFromCart)
 * @deprecated Usar createRequisitionFromCart en su lugar
 */
export const createRequisition = async (payload) => {
    return createRequisitionFromCart(payload);
};

/**
 * Llama al RPC para crear una requisición completa desde el carrito.
 * @param {object} requisitionData - { projectId, comments, items }
 * @returns {Promise<object>} La nueva requisición creada.
 */
export const createRequisitionFromCart = async ({ projectId, comments, items }) => {
    // Validaciones exhaustivas antes de crear la requisición
    if (!projectId) {
        throw new Error("El proyecto es requerido.");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("No se puede crear una requisición sin productos.");
    }
    
    // Validar que todos los items tengan los campos requeridos
    for (const item of items) {
        if (!item.id) {
            throw new Error("Uno o más productos no tienen ID válido.");
        }
        if (!item.quantity || item.quantity <= 0) {
            throw new Error("Todos los productos deben tener una cantidad mayor a 0.");
        }
        if (!Number.isInteger(item.quantity)) {
            throw new Error("La cantidad debe ser un número entero.");
        }
    }

    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

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
        // Manejar errores específicos
        if (error.message?.includes('project') || error.code === '23503') {
            throw new Error("El proyecto seleccionado no existe o no tienes acceso a él.");
        }
        if (error.message?.includes('product') || error.message?.includes('no encontrado')) {
            throw new Error("Uno o más productos ya no están disponibles.");
        }
        throw new Error(formatErrorMessage(error));
    }

    // Validar que el RPC retornó un ID válido
    if (!data) {
        throw new Error('El RPC no retornó un ID válido.');
    }

    // El RPC devuelve el ID, hacemos una consulta para obtener el objeto completo
    const { data: newRequisition, error: fetchError } = await supabase
        .from('requisitions')
        .select('id, internal_folio')
        .eq('id', data)
        .single();
    
    if (fetchError) {
         logger.error('Error fetching new requisition after creation:', fetchError);
         throw new Error(formatErrorMessage(fetchError));
    }
    
    if (!newRequisition) {
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
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }
    
    // CORREGIDO: Usar created_by según REFERENCIA_TECNICA_BD_SUPABASE.md
    const { data: requisitions, error } = await supabase
        .from('requisitions')
        .select('id, internal_folio, created_at, total_amount, project_id, created_by')
        .eq('business_status', 'submitted')
        .order('created_at', { ascending: true });
    
    if (error) {
        logger.error('Error fetching pending approvals:', error);
        throw new Error(formatErrorMessage(error));
    }

    // Optimizar: Reutilizar función helper para enriquecer datos
    const enrichedRequisitions = (requisitions || []).length > 0
        ? await enrichRequisitionsWithRelations(requisitions, ['project', 'creator'])
        : [];

    return enrichedRequisitions;
};

/**
 * Envía una requisición para aprobación (cambia el estado a 'submitted').
 * NOTA: Usa la función de BD submit_requisition que maneja la lógica completa.
 * @param {string} requisitionId - ID de la requisición.
 * @returns {Promise<object>} Resultado de la operación.
 */
export const submitRequisition = async (requisitionId) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // Usar función de BD que maneja la lógica completa (validaciones, estados, etc.)
    const { data, error } = await supabase.rpc('submit_requisition', {
        p_requisition_id: requisitionId
    });

    if (error) {
        logger.error('Error submitting requisition:', error);
        throw new Error(formatErrorMessage(error));
    }
    
    if (!data) {
        throw new Error('No se pudo enviar la requisición.');
    }
    
    // La función RPC ya retorna toda la información necesaria, no necesitamos query adicional
    return data;
};

/**
 * Actualiza el estado de una requisición (aprobación/rechazo).
 * NOTA: Usa funciones de BD (approve_requisition/reject_requisition) que manejan la lógica completa.
 * @param {string} requisitionId - ID de la requisición.
 * @param {string} status - Nuevo estado ('approved' o 'rejected').
 * @param {string} reason - Razón del rechazo (opcional, requerido si status es 'rejected').
 * @returns {Promise<object>} Requisición actualizada.
 */
export const updateRequisitionStatus = async (requisitionId, status, reason = null) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    if (status === 'approved') {
        // Usar función de BD que maneja validaciones y lógica completa
        const { data, error } = await supabase.rpc('approve_requisition', {
            p_requisition_id: requisitionId,
            p_comments: reason || null
        });

        if (error) {
            logger.error('Error approving requisition:', error);
            throw new Error(formatErrorMessage(error));
        }

        // La función RPC ya retorna la requisición actualizada, no necesitamos query adicional
        return data;
    } else if (status === 'rejected') {
        if (!reason || !reason.trim()) {
            throw new Error("La razón del rechazo es requerida.");
        }

        // Usar función de BD que maneja validaciones y lógica completa
        const { data, error } = await supabase.rpc('reject_requisition', {
            p_requisition_id: requisitionId,
            p_reason: reason.trim()
        });

        if (error) {
            logger.error('Error rejecting requisition:', error);
            throw new Error(formatErrorMessage(error));
        }

        // La función RPC ya retorna la requisición actualizada, no necesitamos query adicional
        return data;
    } else {
        throw new Error(`Estado no válido: ${status}. Solo se permiten 'approved' o 'rejected'.`);
    }
};
