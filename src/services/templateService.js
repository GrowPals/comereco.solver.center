
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene todas las plantillas para el usuario autenticado.
 * @returns {Promise<Array>} Lista de plantillas.
 */
export async function getTemplates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('requisition_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching templates from Supabase:', error);
    return [];
  }
  return data;
}

/**
 * Guarda una nueva plantilla en la base de datos.
 * @param {string} name - Nombre de la plantilla.
 * @param {Array} items - Items del carrito para guardar.
 * @param {string} description - Descripción opcional.
 * @returns {Promise<object|null>} La plantilla creada.
 */
export async function saveTemplate(name, items, description = '') {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', authUser.id).single();

  if (!authUser || !profile) {
    logger.error('User not found for saving template');
    return null;
  }
  
  const newTemplate = {
    user_id: authUser.id,
    company_id: profile.company_id,
    name,
    description,
    items, // Directamente el array de items del carrito
  };

  const { data, error } = await supabase
    .from('requisition_templates')
    .insert(newTemplate)
    .select()
    .single();

  if (error) {
    logger.error('Error saving template to Supabase:', error);
    return null;
  }
  return data;
}

/**
 * Elimina una plantilla de la base de datos.
 * @param {string} templateId - El ID de la plantilla a eliminar.
 */
export async function deleteTemplate(templateId) {
  const { error } = await supabase
    .from('requisition_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    logger.error('Error deleting template from Supabase:', error);
    throw error;
  }
}

/**
 * Actualiza una plantilla existente (ej. marcar como favorita).
 * @param {string} templateId - El ID de la plantilla.
 * @param {boolean} isFavorite - El nuevo estado de favorito.
 * @returns {Promise<object|null>} La plantilla actualizada.
 */
export async function toggleFavorite(templateId, isFavorite) {
    const { data, error } = await supabase
    .from('requisition_templates')
    .update({ is_favorite: isFavorite })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating favorite status:', error);
    throw error;
  }
  return data;
}


/**
 * Llama a la función RPC para usar una plantilla, lo que crea una requisición
 * e incrementa los contadores de forma atómica.
 * @param {string} templateId - El ID de la plantilla a usar.
 * @returns {Promise<string|null>} El ID de la nueva requisición.
 */
export async function createRequisitionFromTemplate(templateId) {
    const { data, error } = await supabase.rpc('use_requisition_template', {
        p_template_id: templateId
    });

    if (error) {
        logger.error('Error calling use_requisition_template RPC:', error);
        throw error;
    }

    return data; // El ID de la nueva requisición
}
