
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

export const performGlobalSearch = async (query, companyId) => {
  const sanitizedQuery = typeof query === 'string' ? query.trim() : '';

  if (!sanitizedQuery || sanitizedQuery.length < 2 || !companyId) {
    return { productos: [], requisiciones: [], usuarios: [] };
  }
  
  const searchTerm = `%${sanitizedQuery}%`;

  try {
    const [productosRes, requisicionesRes, usuariosRes] = await Promise.all([
      supabase.from('products').select('id, name, sku, image_url').or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`).limit(5),
      supabase.from('requisitions').select('id, internal_folio, comments').or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`).limit(5),
      supabase.from('profiles').select('id, full_name, role_v2, avatar_url').eq('company_id', companyId).or(`full_name.ilike.${searchTerm}`).limit(5),
    ]);

    if (productosRes.error) logger.error('Search error (products):', productosRes.error.message);
    if (requisicionesRes.error) logger.error('Search error (requisitions):', requisicionesRes.error.message);
    if (usuariosRes.error) logger.error('Search error (users):', usuariosRes.error.message);

    return {
      productos: productosRes.data || [],
      requisiciones: requisicionesRes.data || [],
      usuarios: usuariosRes.data || [],
    };
  } catch (error) {
    logger.error('Global search failed:', error);
    return { productos: [], requisiciones: [], usuarios: [] };
  }
};
