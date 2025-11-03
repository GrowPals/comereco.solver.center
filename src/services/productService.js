
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import { formatErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * CORREGIDO: Asegura que la sesión esté activa antes de hacer queries
 * RLS filtra automáticamente por company_id según REFERENCIA_TECNICA_BD_SUPABASE.md
 */
export const fetchProducts = async ({ pageParam = 0, searchTerm = '', category = '', availability = '' }) => {
    try {
        // Validar sesión antes de hacer queries (usando cache)
        const { session, error: sessionError } = await getCachedSession();
        if (sessionError || !session) {
            // En lugar de lanzar error, devolver datos vacíos para que la UI se muestre
            return { products: [], totalCount: 0 };
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
        if (category && category.trim() !== '') {
            query = query.eq('category', category);
        }
        if (availability === 'in_stock') {
            query = query.gt('stock', 0);
        }

        const { data, error, count } = await query;

        if (error) {
            logger.error('Error fetching products:', error);
            // En lugar de lanzar error, devolver datos vacíos para que la UI se muestre
            return { products: [], totalCount: 0 };
        }

        return {
            products: data || [],
            nextPage: (to + 1) < (count || 0) ? pageParam + 1 : undefined,
            totalCount: count || 0,
        };
    } catch (err) {
        logger.error('Exception in fetchProducts:', err);
        // Devolver datos vacíos en caso de excepción
        return { products: [], totalCount: 0 };
    }
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
    // Optimizado: Usar helper cacheado para obtener company_id
    const { companyId, error: companyError } = await getCachedCompanyId();
    if (companyError || !companyId) return [];
    
    const { data, error } = await supabase.rpc('get_unique_product_categories', {
        company_id_param: companyId
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
        .order('name', { ascending: true });
        
    if (error) {
        logger.error('Error fetching admin products:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data || [];
};

/**
 * CORREGIDO: Valida sesión y maneja errores correctamente
 * Valida datos antes de crear producto
 */
export const createProduct = async (productData) => {
    // Validar datos requeridos
    if (!productData.name || !productData.name.trim()) {
        throw new Error("El nombre del producto es requerido.");
    }
    if (!productData.sku || !productData.sku.trim()) {
        throw new Error("El SKU del producto es requerido.");
    }
    if (productData.price === undefined || productData.price === null) {
        throw new Error("El precio del producto es requerido.");
    }
    if (typeof productData.price !== 'number' || productData.price < 0) {
        throw new Error("El precio debe ser un número mayor o igual a 0.");
    }
    if (productData.stock === undefined || productData.stock === null) {
        throw new Error("El stock del producto es requerido.");
    }
    if (!Number.isInteger(productData.stock) || productData.stock < 0) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0.");
    }

    // Optimizado: Usar helper cacheado para obtener company_id
    const { companyId, error: companyError } = await getCachedCompanyId();
    if (companyError || !companyId) {
        throw new Error("No se pudo obtener la información de la empresa.");
    }
    
    // Bind ID no se maneja en el MVP, se puede poner un placeholder
    const bind_id = productData.sku + '-bind-placeholder';

    const { data, error } = await supabase
        .from('products')
        .insert([{ 
            ...productData, 
            company_id: companyId, 
            bind_id,
            name: productData.name.trim(),
            sku: productData.sku.trim(),
            price: Number(productData.price),
            stock: Math.floor(Number(productData.stock)),
            is_active: productData.is_active !== undefined ? productData.is_active : true
        }])
        .select()
        .single();
        
    if (error) {
        logger.error('Error creating product:', error);
        // Manejar errores específicos de Supabase
        if (error.code === '23505') { // Unique violation
            throw new Error("Ya existe un producto con este SKU.");
        }
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
    
    // Validar datos críticos si se están actualizando
    if (productData.name !== undefined && (!productData.name || !productData.name.trim())) {
        throw new Error("El nombre del producto no puede estar vacío.");
    }
    if (productData.sku !== undefined && (!productData.sku || !productData.sku.trim())) {
        throw new Error("El SKU del producto no puede estar vacío.");
    }
    if (productData.price !== undefined && (typeof productData.price !== 'number' || productData.price < 0)) {
        throw new Error("El precio debe ser un número mayor o igual a 0.");
    }
    if (productData.stock !== undefined && (!Number.isInteger(productData.stock) || productData.stock < 0)) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0.");
    }
    
    const { id, ...updateData } = productData;
    
    // Limpiar y normalizar datos antes de actualizar
    const cleanedData = { ...updateData };
    if (cleanedData.name) cleanedData.name = cleanedData.name.trim();
    if (cleanedData.sku) cleanedData.sku = cleanedData.sku.trim();
    if (cleanedData.price !== undefined) cleanedData.price = Number(cleanedData.price);
    if (cleanedData.stock !== undefined) cleanedData.stock = Math.floor(Number(cleanedData.stock));
    
    const { data, error } = await supabase
        .from('products')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();
        
    if (error) {
        logger.error('Error updating product:', error);
        // Manejar errores específicos de Supabase
        if (error.code === '23505') { // Unique violation
            throw new Error("Ya existe un producto con este SKU.");
        }
        if (error.code === 'PGRST116') { // Not found
            throw new Error("Producto no encontrado.");
        }
        throw new Error(formatErrorMessage(error));
    }
    
    if (!data) {
        throw new Error("No se pudo actualizar el producto.");
    }
    
    return data;
};

export const deleteProduct = async (productId) => {
    if (!productId) {
        throw new Error("El ID del producto es requerido.");
    }
    
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }
    
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
    if (error) {
        logger.error('Error deleting product:', error);
        if (error.code === '23503') { // Foreign key violation
            throw new Error("No se puede eliminar el producto porque está siendo usado en requisiciones existentes.");
        }
        throw new Error(formatErrorMessage(error));
    }
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
