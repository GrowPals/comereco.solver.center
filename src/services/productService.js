
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * CORREGIDO: Asegura que la sesión esté activa antes de hacer queries
 * RLS filtra automáticamente por company_id según REFERENCIA_TECNICA_BD_SUPABASE.md
 */
export const fetchProducts = async ({ pageParam = 0, searchTerm = '', category = '', availability = '' }) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const ITEMS_PER_PAGE = 12;
    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // RLS filtra automáticamente por company_id del usuario autenticado
    let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(from, to);
    
    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }
    if (category) {
        query = query.eq('category', category);
    }
    if (availability === 'in_stock') {
        query = query.gt('stock', 0);
    }

    const { data, error, count } = await query;

    if (error) {
        logger.error("Error fetching products:", error);
        throw new Error(formatErrorMessage(error));
    }
    
    return {
        products: data || [],
        nextPage: (to + 1) < (count || 0) ? pageParam + 1 : undefined,
        totalCount: count || 0,
    };
};

export const fetchProductById = async (productId) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error) {
        logger.error("Error fetching product by id:", error);
        if (error.code === 'PGRST116') { // Not found
             throw new Error("Producto no encontrado.");
        }
        throw new Error(formatErrorMessage(error));
    }
    
    if (!data) {
        throw new Error("Producto no encontrado.");
    }
    
    return data;
};

export const fetchProductCategories = async () => {
    // Obtener el company_id del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
    
    if (!profile?.company_id) return [];

    const { data, error } = await supabase.rpc('get_unique_product_categories', {
        p_company_id: profile.company_id
    });
    if (error) {
        logger.error("Error fetching categories:", error);
        return [];
    }
    
    if (!data || !Array.isArray(data)) {
        return [];
    }
    
    return data.map(c => c?.category).filter(Boolean);
};

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * RLS filtra automáticamente por company_id
 */
export const getAdminProducts = async () => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        logger.error('Error fetching admin products:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data || [];
};

/**
 * CORREGIDO: Valida sesión y maneja errores correctamente
 */
export const createProduct = async (productData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Usuario no autenticado.");
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        logger.error('Error fetching user profile:', profileError);
        throw new Error("No se pudo obtener el perfil del usuario.");
    }
    
    // Bind ID no se maneja en el MVP, se puede poner un placeholder
    const bind_id = productData.sku + '-bind-placeholder';

    const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, company_id: profile.company_id, bind_id }])
        .select()
        .single();
        
    if (error) {
        logger.error('Error creating product:', error);
        throw new Error(formatErrorMessage(error));
    }
    
    if (!data) {
        throw new Error("No se pudo crear el producto.");
    }
    
    return data;
};

export const updateProduct = async (productData) => {
    if (!productData || !productData.id) {
        throw new Error("Datos del producto inválidos.");
    }
    
    const { id, ...updateData } = productData;
    const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
    if (error) {
        logger.error('Error updating product:', error);
        throw new Error(formatErrorMessage(error));
    }
    
    if (!data) {
        throw new Error("No se pudo actualizar el producto.");
    }
    
    return data;
};

// Aliases para compatibilidad con hooks
export const getProducts = async (filters = {}) => {
    const { searchTerm = '', category = '', page = 1, pageSize = 12 } = filters;
    const pageParam = page - 1;
    const result = await fetchProducts({ pageParam, searchTerm, category });
    return {
        data: result.products || [],
        count: result.totalCount || 0,
        total: result.totalCount || 0, // Mantener ambos para compatibilidad
    };
};

export const getProductById = fetchProductById;

export const getUniqueProductCategories = fetchProductCategories;
