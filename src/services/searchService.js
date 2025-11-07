
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getScopedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';

/**
 * Búsqueda global en productos, requisiciones y usuarios.
 * SEGURIDAD: Obtiene el company_id de la sesión del usuario, no del cliente.
 * @param {string} query - Término de búsqueda
 * @returns {Promise<{productos: Array, requisiciones: Array, usuarios: Array}>}
 */
export const performGlobalSearch = async (query) => {
  // Validación de entrada
  const sanitizedQuery = typeof query === 'string' ? query.trim() : '';

  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    return { productos: [], requisiciones: [], usuarios: [] };
  }

  try {
    // CRÍTICO: Validar sesión antes de hacer queries
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
      logger.error('Search failed: No valid session');
      throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
    }

    // CRÍTICO: Obtener company_id de la sesión del usuario (no del cliente)
    const { companyId, error: companyError, isGlobal } = await getScopedCompanyId({ allowGlobal: true });
    if (companyError) {
      logger.error('Search failed: Could not get scoped company', companyError);
      throw new Error(companyError?.message || 'No se pudo obtener la información de la empresa.');
    }

    const searchTerm = `%${sanitizedQuery}%`;

    // Realizar búsquedas en paralelo
    // RLS filtra automáticamente por company_id en products y requisitions
    let profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, role_v2, avatar_url')
      .ilike('full_name', searchTerm)
      .limit(5);

    if (!isGlobal && companyId) {
      profilesQuery = profilesQuery.eq('company_id', companyId);
    }

    const [productosRes, requisicionesRes, usuariosRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku, image_url, price')
        .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(5),
      supabase
        .from('requisitions')
        .select('id, internal_folio, comments, business_status, created_at')
        .or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)
        .limit(5),
      profilesQuery,
    ]);

    // Manejar errores individuales sin romper la búsqueda completa
    if (productosRes.error) {
      logger.error('Search error (products):', productosRes.error.message);
    }
    if (requisicionesRes.error) {
      logger.error('Search error (requisitions):', requisicionesRes.error.message);
    }
    if (usuariosRes.error) {
      logger.error('Search error (users):', usuariosRes.error.message);
    }

    return {
      productos: productosRes.data || [],
      requisiciones: requisicionesRes.data || [],
      usuarios: usuariosRes.data || [],
    };
  } catch (error) {
    logger.error('Global search failed:', error);
    // Re-lanzar errores de sesión para forzar re-autenticación
    if (error.message.includes('Sesión no válida')) {
      throw error;
    }
    // Para otros errores, devolver arrays vacíos
    return { productos: [], requisiciones: [], usuarios: [] };
  }
};
