
import { supabase } from '@/lib/customSupabaseClient';
import logger from '@/utils/logger';

/**
 * Obtiene todas las plantillas del usuario actual.
 * @returns {Promise<Array>} Lista de plantillas.
 */
export const getTemplates = async () => {
    const { data, error } = await supabase
        .from('requisition_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error fetching templates:', error);
        throw new Error('No se pudieron cargar las plantillas.');
    }
    return data;
};

/**
 * Crea una nueva plantilla de requisición.
 * @param {object} templateData - { name, description, items, project_id (opcional) }
 * @returns {Promise<object>} La plantilla creada.
 */
export const createTemplate = async (templateData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado.');
    
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    if (!profile) throw new Error('Perfil de usuario no encontrado.');

    const { data, error } = await supabase
        .from('requisition_templates')
        .insert([{
            ...templateData,
            user_id: user.id,
            company_id: profile.company_id,
        }])
        .select()
        .single();
    
    if (error) {
        logger.error('Error creating template:', error);
        throw new Error(`Error al crear plantilla: ${error.message}`);
    }
    return data;
};

/**
 * Actualiza una plantilla existente.
 * @param {object} templateData - Datos a actualizar, debe incluir el id.
 * @returns {Promise<object>} La plantilla actualizada.
 */
export const updateTemplate = async (templateData) => {
    const { id, ...updateData } = templateData;
    const { data, error } = await supabase
        .from('requisition_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        logger.error('Error updating template:', error);
        throw new Error(`Error al actualizar plantilla: ${error.message}`);
    }
    return data;
};

/**
 * Elimina una plantilla.
 * @param {string} templateId - ID de la plantilla a eliminar.
 */
export const deleteTemplate = async (templateId) => {
    const { error } = await supabase
        .from('requisition_templates')
        .delete()
        .eq('id', templateId);
    
    if (error) {
        logger.error('Error deleting template:', error);
        throw new Error(`Error al eliminar plantilla: ${error.message}`);
    }
};

/**
 * Llama al RPC para crear una requisición borrador desde una plantilla.
 * @param {string} templateId - El ID de la plantilla a usar.
 * @returns {Promise<string>} El ID de la nueva requisición creada.
 */
export const useTemplateForRequisition = async (templateId) => {
    const { data, error } = await supabase.rpc('use_requisition_template', {
        p_template_id: templateId,
    });

    if (error) {
        logger.error('Error in use_requisition_template RPC:', error);
        throw new Error(error.message || 'Error al usar la plantilla.');
    }
    
    return data; // El RPC devuelve el ID de la nueva requisición
};
