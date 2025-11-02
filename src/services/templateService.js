
import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * CORREGIDO: Valida sesión antes de hacer queries
 * Obtiene todas las plantillas del usuario actual.
 * RLS filtra automáticamente según REFERENCIA_TECNICA_BD_SUPABASE.md
 * Ordena por: favoritas primero, luego por último uso, luego por fecha de creación.
 * @returns {Promise<Array>} Lista de plantillas.
 */
export const getTemplates = async () => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // RLS filtra automáticamente por user_id y company_id
    // CORREGIDO: Ordenamiento correcto según PROMPT 7
    // 1. Favoritas primero (is_favorite DESC)
    // 2. Luego por último uso (last_used_at DESC)
    // 3. Finalmente por fecha de creación (created_at DESC)
    const { data, error } = await supabase
        .from('requisition_templates')
        .select('id, name, description, items, is_favorite, usage_count, last_used_at, project_id, company_id, created_at, updated_at')
        .eq('user_id', session.user.id)
        .order('is_favorite', { ascending: false })
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error fetching templates:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data || [];
};

/**
 * CORREGIDO: Valida sesión y estructura JSONB items correctamente
 * Crea una nueva plantilla de requisición.
 * @param {object} templateData - { name, description, items, project_id (opcional) }
 * @returns {Promise<object>} La plantilla creada.
 */
export const createTemplate = async (templateData) => {
    // Validar sesión antes de hacer queries
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Usuario no autenticado.');
    }
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
        
    if (profileError || !profile) {
        logger.error('Error fetching user profile:', profileError);
        throw new Error('Perfil de usuario no encontrado.');
    }

    // Validar estructura de items JSONB según PROMPT 7
    // Formato esperado: Array de objetos con product_id y quantity
    // Compatible con create_full_requisition RPC
    if (templateData.items && !Array.isArray(templateData.items)) {
        throw new Error('El campo items debe ser un array.');
    }
    
    if (templateData.items && templateData.items.length > 0) {
        const invalidItems = templateData.items.filter(item => 
            !item.product_id || typeof item.quantity !== 'number' || item.quantity <= 0
        );
        if (invalidItems.length > 0) {
            throw new Error('Todos los items deben tener product_id válido y quantity positivo.');
        }
    }

    const { data, error } = await supabase
        .from('requisition_templates')
        .insert([{
            ...templateData,
            user_id: user.id,
            company_id: profile.company_id,
            items: templateData.items || [],
        }])
        .select()
        .single();
    
    if (error) {
        logger.error('Error creating template:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data;
};

/**
 * CORREGIDO: Valida sesión, permisos y estructura JSONB items
 * Actualiza una plantilla existente.
 * Solo el usuario propietario puede actualizar su plantilla.
 * @param {object} templateData - Datos a actualizar, debe incluir el id.
 * @returns {Promise<object>} La plantilla actualizada.
 */
export const updateTemplate = async (templateData) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    const { id, ...updateData } = templateData;

    // Verificar que la plantilla existe y pertenece al usuario autenticado
    const { data: existingTemplate, error: fetchError } = await supabase
        .from('requisition_templates')
        .select('user_id, items')
        .eq('id', id)
        .single();

    if (fetchError || !existingTemplate) {
        throw new Error('Plantilla no encontrada.');
    }

    if (existingTemplate.user_id !== session.user.id) {
        throw new Error('No tienes permisos para editar esta plantilla.');
    }

    // Validar estructura de items JSONB si se está actualizando
    if (updateData.items !== undefined) {
        if (!Array.isArray(updateData.items)) {
            throw new Error('El campo items debe ser un array.');
        }
        
        if (updateData.items.length > 0) {
            const invalidItems = updateData.items.filter(item => 
                !item.product_id || typeof item.quantity !== 'number' || item.quantity <= 0
            );
            if (invalidItems.length > 0) {
                throw new Error('Todos los items deben tener product_id válido y quantity positivo.');
            }
        }
    }

    const { data, error } = await supabase
        .from('requisition_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id) // Doble verificación de permisos
        .select()
        .single();
    
    if (error) {
        logger.error('Error updating template:', error);
        throw new Error(formatErrorMessage(error));
    }
    return data;
};

/**
 * CORREGIDO: Valida sesión y permisos
 * Elimina una plantilla.
 * Solo el usuario propietario puede eliminar su plantilla.
 * @param {string} templateId - ID de la plantilla a eliminar.
 */
export const deleteTemplate = async (templateId) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // Verificar que la plantilla existe y pertenece al usuario autenticado
    const { data: existingTemplate, error: fetchError } = await supabase
        .from('requisition_templates')
        .select('user_id')
        .eq('id', templateId)
        .single();

    if (fetchError || !existingTemplate) {
        throw new Error('Plantilla no encontrada.');
    }

    if (existingTemplate.user_id !== session.user.id) {
        throw new Error('No tienes permisos para eliminar esta plantilla.');
    }

    const { error } = await supabase
        .from('requisition_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', session.user.id); // Doble verificación de permisos
    
    if (error) {
        logger.error('Error deleting template:', error);
        throw new Error(formatErrorMessage(error));
    }
};

/**
 * CORREGIDO: Valida sesión antes de usar plantilla
 * Llama al RPC para crear una requisición borrador desde una plantilla.
 * El RPC incrementa usage_count y actualiza last_used_at automáticamente.
 * @param {string} templateId - El ID de la plantilla a usar.
 * @returns {Promise<string>} El ID de la nueva requisición creada.
 */
export const useTemplateForRequisition = async (templateId) => {
    // Validar sesión antes de hacer queries (usando cache)
    const { session, error: sessionError } = await getCachedSession();
    if (sessionError || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }

    // Verificar que la plantilla existe y pertenece al usuario autenticado
    const { data: existingTemplate, error: fetchError } = await supabase
        .from('requisition_templates')
        .select('user_id, items')
        .eq('id', templateId)
        .single();

    if (fetchError || !existingTemplate) {
        throw new Error('Plantilla no encontrada.');
    }

    if (existingTemplate.user_id !== session.user.id) {
        throw new Error('No tienes permisos para usar esta plantilla.');
    }

    // Validar que la plantilla tenga items
    if (!existingTemplate.items || !Array.isArray(existingTemplate.items) || existingTemplate.items.length === 0) {
        throw new Error('La plantilla no tiene items válidos.');
    }

    const { data, error } = await supabase.rpc('use_requisition_template', {
        p_template_id: templateId,
    });

    if (error) {
        logger.error('Error in use_requisition_template RPC:', error);
        throw new Error(formatErrorMessage(error));
    }
    
    return data; // El RPC devuelve el ID de la nueva requisición
};
