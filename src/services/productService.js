
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Fetches products from Supabase with filtering, sorting, and pagination.
 *
 * @param {object} options - The options for fetching products.
 * @param {string} [options.searchTerm=''] - The term to search for in product names and SKUs.
 * @param {string} [options.category=''] - The category to filter by.
 * @param {string} [options.sortBy='name'] - The field to sort by.
 * @param {boolean} [options.sortAsc=true] - The sort direction.
 * @param {number} [options.page=1] - The current page number.
 * @param {number} [options.limit=12] - The number of items per page.
 * @returns {Promise<{data: object[], count: number}>} - The products and total count.
 */
export const getProducts = async ({
  searchTerm = '',
  category = '',
  sortBy = 'name',
  sortAsc = true,
  page = 1,
  limit = 12,
}) => {
  try {
    // Construimos la consulta base
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // 1. Filtrado por término de búsqueda (nombre o SKU)
    if (searchTerm) {
      // Usamos 'ilike' para búsqueda case-insensitive
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }

    // 2. Filtrado por categoría
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 3. Ordenamiento
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortAsc });
    }

    // 4. Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ejecutamos la consulta
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { data, count };
  } catch (error) {
    logger.error('Error fetching products from Supabase:', error);
    // Devolvemos un estado vacío en caso de error para no romper la UI
    return { data: [], count: 0 };
  }
};

/**
 * Fetches all unique product categories from the database.
 * @returns {Promise<string[]>} A list of unique category names.
 */
export const getCategories = async () => {
    try {
        const { data, error } = await supabase.rpc('get_unique_product_categories');

        if (error) {
            throw error;
        }
        
        // El RPC devuelve un array de objetos { category: '...' }, lo aplanamos.
        return data.map(item => item.category).sort();

    } catch (error) {
        logger.error('Error fetching categories from Supabase:', error);
        return [];
    }
};
