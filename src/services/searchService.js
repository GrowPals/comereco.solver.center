
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Realiza una búsqueda global en productos, requisiciones y usuarios.
 * @param {string} query - El término de búsqueda.
 * @returns {Promise<{productos: any[], requisiciones: any[], usuarios: any[]}>}
 */
export const performGlobalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return { productos: [], requisiciones: [], usuarios: [] };
  }

  const searchTerm = `%${query.trim()}%`;

  try {
    // Usamos Promise.all para ejecutar las búsquedas en paralelo para máxima eficiencia
    const [productosRes, requisicionesRes, usuariosRes] = await Promise.all([
      // Búsqueda en Productos
      supabase
        .from('products')
        .select('id, name, sku, image_url')
        .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        .limit(5),
      
      // Búsqueda en Requisiciones
      supabase
        .from('requisitions')
        .select('id, internal_folio, comments, profiles(full_name)')
        .or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)
        .limit(5),

      // Búsqueda en Usuarios (perfiles)
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .or(`full_name.ilike.${searchTerm}`) // El email está en auth.users, así que solo buscamos por nombre aquí
        .limit(5),
    ]);

    if (productosRes.error) logger.error('Error en búsqueda de productos:', productosRes.error.message);
    if (requisicionesRes.error) logger.error('Error en búsqueda de requisiciones:', requisicionesRes.error.message);
    if (usuariosRes.error) logger.error('Error en búsqueda de usuarios:', usuariosRes.error.message);

    return {
      productos: productosRes.data || [],
      requisiciones: requisicionesRes.data || [],
      usuarios: usuariosRes.data || [],
    };
  } catch (error) {
    logger.error('Error fatal en la búsqueda global:', error);
    return { productos: [], requisiciones: [], usuarios: [] };
  }
};
