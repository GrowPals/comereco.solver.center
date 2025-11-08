
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getScopedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { PAGINATION } from '@/constants/config';

// Sistema de cancelación de búsquedas
let currentSearchToken = 0;

/**
 * Búsqueda global en productos, requisiciones y usuarios.
 * SEGURIDAD: Obtiene el company_id de la sesión del usuario, no del cliente.
 * OPTIMIZACIÓN: Ignora resultados de búsquedas obsoletas para evitar race conditions.
 * @param {string} query - Término de búsqueda
 * @param {Object} options - Opciones adicionales
 * @param {number} options.searchToken - Token para identificar esta búsqueda
 * @returns {Promise<{productos: Array, requisiciones: Array, usuarios: Array, isCancelled?: boolean}>}
 */
export const performGlobalSearch = async (query, options = {}) => {
  const searchToken = options.searchToken || ++currentSearchToken;
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
      .limit(PAGINATION.SEARCH_LIMIT);

    if (!isGlobal && companyId) {
      profilesQuery = profilesQuery.eq('company_id', companyId);
    }

    const [productosRes, requisicionesRes, usuariosRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku, image_url, price')
        .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(PAGINATION.SEARCH_LIMIT),
      supabase
        .from('requisitions')
        .select('id, internal_folio, comments, business_status, created_at')
        .or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)
        .limit(PAGINATION.SEARCH_LIMIT),
      profilesQuery,
    ]);

    // Verificar si esta búsqueda fue cancelada por una más reciente
    if (searchToken !== currentSearchToken) {
      logger.debug(`Search cancelled (token ${searchToken}, current ${currentSearchToken})`);
      return {
        productos: [],
        requisiciones: [],
        usuarios: [],
        isCancelled: true,
      };
    }

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

    // Verificar una vez más antes de devolver resultados
    if (searchToken !== currentSearchToken) {
      logger.debug(`Search cancelled after queries (token ${searchToken}, current ${currentSearchToken})`);
      return {
        productos: [],
        requisiciones: [],
        usuarios: [],
        isCancelled: true,
      };
    }

    return {
      productos: productosRes.data || [],
      requisiciones: requisicionesRes.data || [],
      usuarios: usuariosRes.data || [],
      isCancelled: false,
    };
  } catch (error) {
    logger.error('Global search failed:', error);
    // Re-lanzar errores de sesión para forzar re-autenticación
    if (error.message.includes('Sesión no válida')) {
      throw error;
    }
    // Para otros errores, devolver arrays vacíos
    return { productos: [], requisiciones: [], usuarios: [], isCancelled: false };
  }
};

/**
 * Obtiene un nuevo token de búsqueda
 * Útil para componentes que quieren controlar la cancelación
 * @returns {number} Nuevo token de búsqueda
 */
export const getSearchToken = () => {
  return ++currentSearchToken;
};
