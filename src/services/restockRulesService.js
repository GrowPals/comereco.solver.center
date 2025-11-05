import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

const RESTOCK_RULE_SELECT = `
    id,
    company_id,
    product_id,
    project_id,
    min_stock,
    reorder_quantity,
    status,
    notes,
    preferred_vendor,
    preferred_warehouse,
    created_by,
    updated_by,
    created_at,
    updated_at,
    products:products(
        id,
        name,
        sku,
        stock,
        category,
        image_url
    ),
    projects:projects(
        id,
        name,
        status
    )
`;

const ensureSession = async () => {
    const { session, error } = await getCachedSession();
    if (error || !session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }
    return session;
};

const getCompanyId = async () => {
    const { companyId, error } = await getCachedCompanyId();
    if (error || !companyId) {
        throw new Error('No se pudo determinar la empresa del usuario.');
    }
    return companyId;
};

const normalizeProjectFilter = (query, projectId) => {
    if (projectId === undefined) {
        return query;
    }

    if (projectId === null || projectId === 'none') {
        return query.is('project_id', null);
    }

    return query.eq('project_id', projectId);
};

export const getRestockRule = async ({ productId, projectId } = {}) => {
    if (!productId) {
        throw new Error('Se requiere el identificador del producto.');
    }

    try {
        const companyId = await getCompanyId();

        let query = supabase
            .from('inventory_restock_rules')
            .select(RESTOCK_RULE_SELECT)
            .eq('company_id', companyId)
            .eq('product_id', productId)
            .order('updated_at', { ascending: false })
            .limit(1);

        query = normalizeProjectFilter(query, projectId);

        const { data, error } = await query.maybeSingle();

        if (error) {
            logger.error('Error fetching restock rule:', error);
            throw new Error(formatErrorMessage(error));
        }

        return data ?? null;
    } catch (err) {
        logger.error('Unexpected error in getRestockRule:', err);
        throw err;
    }
};

export const listRestockRules = async ({
    page = 1,
    pageSize = 10,
    status,
    projectId,
    category,
    searchTerm
} = {}) => {
    try {
        const companyId = await getCompanyId();

        const safePageSize = Math.max(1, Math.min(pageSize, 100));
        const from = (Math.max(1, page) - 1) * safePageSize;
        const to = from + safePageSize - 1;

        let query = supabase
            .from('inventory_restock_rules')
            .select(RESTOCK_RULE_SELECT, { count: 'exact' })
            .eq('company_id', companyId)
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        query = normalizeProjectFilter(query, projectId);

        if (category && category !== 'all') {
            query = query.eq('products.category', category);
        }

        if (searchTerm && searchTerm.trim() !== '') {
            const sanitized = searchTerm.trim().replace(/[\s]+/g, ' ');
            query = query.or(
                `notes.ilike.%${sanitized}%,preferred_vendor.ilike.%${sanitized}%,products.name.ilike.%${sanitized}%,products.sku.ilike.%${sanitized}%`
            );
        }

        const { data, count, error } = await query;

        if (error) {
            logger.error('Error listing restock rules:', error);
            throw new Error(formatErrorMessage(error));
        }

        return {
            rules: data ?? [],
            total: count ?? 0,
            page,
            pageSize: safePageSize
        };
    } catch (err) {
        logger.error('Unexpected error in listRestockRules:', err);
        throw err;
    }
};

export const upsertRestockRule = async (payload) => {
    if (!payload || !payload.productId) {
        throw new Error('Datos incompletos para guardar la regla.');
    }

    const parsedMinStock = Number(payload.minStock);
    const parsedReorder = Number(payload.reorderQuantity);

    if (!Number.isFinite(parsedMinStock) || parsedMinStock < 0) {
        throw new Error('El stock mínimo debe ser un número mayor o igual a cero.');
    }

    if (!Number.isFinite(parsedReorder) || parsedReorder <= 0) {
        throw new Error('La cantidad a solicitar debe ser un número mayor a cero.');
    }

    try {
        const session = await ensureSession();
        const companyId = await getCompanyId();

        const ruleToPersist = {
            id: payload.id,
            company_id: companyId,
            product_id: payload.productId,
            project_id: payload.projectId ?? null,
            min_stock: Math.trunc(parsedMinStock),
            reorder_quantity: Math.trunc(parsedReorder),
            status: payload.status ?? 'active',
            notes: payload.notes?.trim() || null,
            preferred_vendor: payload.preferredVendor?.trim() || null,
            preferred_warehouse: payload.preferredWarehouse?.trim() || null,
            updated_by: session.user?.id ?? null
        };

        if (!ruleToPersist.id) {
            delete ruleToPersist.id;
        }

        const { data, error } = await supabase
            .from('inventory_restock_rules')
            .upsert(ruleToPersist, { onConflict: 'id' })
            .select(RESTOCK_RULE_SELECT)
            .single();

        if (error) {
            logger.error('Error upserting restock rule:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una regla activa para este producto en el proyecto seleccionado.');
            }
            throw new Error(formatErrorMessage(error));
        }

        return data;
    } catch (err) {
        logger.error('Unexpected error in upsertRestockRule:', err);
        throw err;
    }
};

export const toggleRestockRuleStatus = async ({ ruleId, nextStatus }) => {
    if (!ruleId || !nextStatus) {
        throw new Error('Datos incompletos para actualizar el estado de la regla.');
    }

    try {
        const session = await ensureSession();
        const companyId = await getCompanyId();

        const { data, error } = await supabase
            .from('inventory_restock_rules')
            .update({ status: nextStatus, updated_by: session.user?.id ?? null })
            .eq('id', ruleId)
            .eq('company_id', companyId)
            .select(RESTOCK_RULE_SELECT)
            .single();

        if (error) {
            logger.error('Error toggling restock rule status:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una regla activa para este producto y proyecto.');
            }
            throw new Error(formatErrorMessage(error));
        }

        return data;
    } catch (err) {
        logger.error('Unexpected error in toggleRestockRuleStatus:', err);
        throw err;
    }
};

export const deleteRestockRule = async (ruleId) => {
    if (!ruleId) {
        throw new Error('Identificador de regla requerido para eliminar.');
    }

    try {
        await ensureSession();
        const companyId = await getCompanyId();

        const { error } = await supabase
            .from('inventory_restock_rules')
            .delete()
            .eq('id', ruleId)
            .eq('company_id', companyId);

        if (error) {
            logger.error('Error deleting restock rule:', error);
            throw new Error(formatErrorMessage(error));
        }

        return true;
    } catch (err) {
        logger.error('Unexpected error in deleteRestockRule:', err);
        throw err;
    }
};
