
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

export const fetchProducts = async ({ pageParam = 0, searchTerm = '', category = '', availability = '' }) => {
    const ITEMS_PER_PAGE = 12;
    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

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
        throw new Error("No se pudieron cargar los productos.");
    }
    
    return {
        products: data,
        nextPage: (to + 1) < count ? pageParam + 1 : undefined,
        totalCount: count,
    };
};

export const fetchProductById = async (productId) => {
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
        throw new Error("No se pudo cargar el producto.");
    }
    return data;
};

export const fetchProductCategories = async () => {
    const { data, error } = await supabase.rpc('get_unique_product_categories');
    if (error) {
        logger.error("Error fetching categories:", error);
        return [];
    }
    return data.map(c => c.category);
};

// Admin Functions
export const getAdminProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
        logger.error('Error fetching admin products:', error);
        throw new Error('No se pudieron cargar los productos.');
    }
    return data;
};

export const createProduct = async (productData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    
    // Bind ID no se maneja en el MVP, se puede poner un placeholder
    const bind_id = productData.sku + '-bind-placeholder';

    const { data, error } = await supabase.from('products').insert([{ ...productData, company_id: profile.company_id, bind_id }]).select().single();
    if (error) {
        logger.error('Error creating product:', error);
        throw new Error(error.message);
    }
    return data;
};

export const updateProduct = async (productData) => {
    const { id, ...updateData } = productData;
    const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
    if (error) {
        logger.error('Error updating product:', error);
        throw new Error(error.message);
    }
    return data;
};

// Aliases para compatibilidad con hooks
export const getProducts = async (filters = {}) => {
    const { searchTerm = '', category = '', page = 1, pageSize = 12 } = filters;
    const pageParam = page - 1;
    const result = await fetchProducts({ pageParam, searchTerm, category });
    return {
        data: result.products,
        total: result.totalCount,
    };
};

export const getProductById = fetchProductById;

export const getUniqueProductCategories = fetchProductCategories;
