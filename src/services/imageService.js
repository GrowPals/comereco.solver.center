import { supabase } from '@/lib/customSupabaseClient';
import { getCachedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';

/**
 * Sube una imagen a Supabase Storage para un producto
 * @param {File} file - El archivo de imagen a subir
 * @param {string} productId - El ID del producto (opcional, para actualizar)
 * @returns {Promise<string>} La URL pública de la imagen subida
 */
export const uploadProductImage = async (file, productId = null) => {
    if (!file) {
        throw new Error("No se proporcionó ningún archivo.");
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        throw new Error("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).");
    }

    // Validar tamaño (máximo 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        throw new Error("El archivo es demasiado grande. El tamaño máximo es 5MB.");
    }

    try {
        // Obtener company_id para organizar archivos
        const { companyId, error: companyError } = await getCachedCompanyId();
        if (companyError || !companyId) {
            throw new Error("No se pudo obtener la información de la empresa.");
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = productId 
            ? `${companyId}/products/${productId}-${timestamp}-${randomString}.${fileExtension}`
            : `${companyId}/products/temp-${timestamp}-${randomString}.${fileExtension}`;

        // Subir archivo a Supabase Storage
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            logger.error('Error uploading image:', error);
            throw new Error(`Error al subir la imagen: ${error.message}`);
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        logger.error('Exception in uploadProductImage:', error);
        throw error;
    }
};

export const uploadProfileAvatar = async (file, userId) => {
    if (!file) {
        throw new Error('No se proporcionó ningún archivo.');
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Usa imágenes JPG, PNG o WebP.');
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');
    }

    try {
        const { companyId } = await getCachedCompanyId();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).slice(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const safeCompanySegment = companyId ? `${companyId}/profiles` : 'profiles';
        const fileName = `${safeCompanySegment}/${userId || 'user'}-${timestamp}-${randomString}.${extension}`;

        const { error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            logger.error('Error uploading avatar:', error);
            throw new Error(`Error al subir la imagen: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        const url = `${publicUrl}?v=${timestamp}`;
        return url;
    } catch (error) {
        logger.error('Exception in uploadProfileAvatar:', error);
        throw error;
    }
};

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} imageUrl - La URL de la imagen a eliminar
 */
export const deleteProductImage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
        // Extraer el path del archivo de la URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');

        if (!fileName) {
            logger.warn('Could not extract filename from URL:', imageUrl);
            return;
        }

        const { error } = await supabase.storage
            .from('product-images')
            .remove([fileName]);

        if (error) {
            logger.error('Error deleting image:', error);
            // No lanzar error, solo loguear - no es crítico si falla
        }
    } catch (error) {
        logger.error('Exception in deleteProductImage:', error);
        // No lanzar error, solo loguear
    }
};
