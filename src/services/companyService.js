import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession, getCachedCompanyId } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';
import { formatErrorMessage } from '@/utils/errorHandler';

/**
 * Servicio para gestionar empresas (companies)
 * Las empresas están conectadas a todos los usuarios, productos, proyectos, etc.
 */

/**
 * Obtiene todas las empresas del usuario actual.
 * Para usuarios admin/super_admin pueden ver todas las empresas.
 * Para usuarios normales solo ven su propia empresa.
 * @returns {Promise<Array>} Lista de empresas.
 */
export const getAllCompanies = async () => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // RLS filtra automáticamente según el rol del usuario
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, bind_location_id, bind_price_list_id, created_at')
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching companies:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data || [];
};

/**
 * Obtiene una empresa específica por ID.
 * @param {string} companyId - ID de la empresa.
 * @returns {Promise<Object>} Datos de la empresa.
 */
export const getCompanyById = async (companyId) => {
  if (!companyId) {
    throw new Error("El ID de la empresa es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, bind_location_id, bind_price_list_id, created_at')
    .eq('id', companyId)
    .single();

  if (error) {
    logger.error('Error fetching company:', error);
    if (error.code === 'PGRST116') {
      throw new Error("Empresa no encontrada.");
    }
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Obtiene la empresa del usuario actual.
 * @returns {Promise<Object>} Datos de la empresa del usuario.
 */
export const getMyCompany = async () => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Optimizado: Usar helper cacheado para obtener company_id
  const { companyId, error: companyError } = await getCachedCompanyId();
  if (companyError || !companyId) {
    logger.error('Error fetching user profile:', companyError);
    throw new Error("No se pudo obtener la información del usuario.");
  }

  // Obtener datos de la empresa
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, bind_location_id, bind_price_list_id, created_at')
    .eq('id', companyId)
    .single();

  if (error) {
    logger.error('Error fetching company:', error);
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Crea una nueva empresa.
 * Solo disponible para super_admins.
 * @param {Object} companyData - Datos de la empresa.
 * @param {string} companyData.name - Nombre de la empresa (requerido).
 * @param {string} companyData.bind_location_id - ID de ubicación en sistema externo (opcional).
 * @param {string} companyData.bind_price_list_id - ID de lista de precios en sistema externo (opcional).
 * @returns {Promise<Object>} La empresa creada.
 */
export const createCompany = async (companyData) => {
  if (!companyData.name || !companyData.name.trim()) {
    throw new Error("El nombre de la empresa es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { data, error } = await supabase
    .from('companies')
    .insert([{
      name: companyData.name.trim(),
      bind_location_id: companyData.bind_location_id?.trim() || null,
      bind_price_list_id: companyData.bind_price_list_id?.trim() || null,
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating company:', error);
    if (error.code === '23505') { // Unique violation
      throw new Error("Ya existe una empresa con ese nombre.");
    }
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Actualiza una empresa existente.
 * Solo disponible para admins de la empresa o super_admins.
 * @param {string} companyId - ID de la empresa.
 * @param {Object} updateData - Datos a actualizar.
 * @returns {Promise<Object>} La empresa actualizada.
 */
export const updateCompany = async (companyId, updateData) => {
  if (!companyId) {
    throw new Error("El ID de la empresa es requerido.");
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error("No se proporcionaron datos para actualizar.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  // Campos permitidos
  const allowedFields = ['name', 'bind_location_id', 'bind_price_list_id'];
  const filteredUpdate = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      if (updateData[key] !== undefined) {
        obj[key] = typeof updateData[key] === 'string' ? updateData[key].trim() : updateData[key];
      }
      return obj;
    }, {});

  if (Object.keys(filteredUpdate).length === 0) {
    throw new Error("No hay campos válidos para actualizar.");
  }

  const { data, error } = await supabase
    .from('companies')
    .update(filteredUpdate)
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating company:', error);
    if (error.code === 'PGRST116') {
      throw new Error("Empresa no encontrada.");
    }
    if (error.code === '23505') {
      throw new Error("Ya existe una empresa con ese nombre.");
    }
    throw new Error(formatErrorMessage(error));
  }

  return data;
};

/**
 * Elimina una empresa.
 * Solo disponible para super_admins.
 * ⚠️ ADVERTENCIA: Esto eliminará todos los datos relacionados (usuarios, productos, proyectos, etc.).
 * @param {string} companyId - ID de la empresa.
 * @returns {Promise<void>}
 */
export const deleteCompany = async (companyId) => {
  if (!companyId) {
    throw new Error("El ID de la empresa es requerido.");
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
  }

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) {
    logger.error('Error deleting company:', error);
    if (error.code === 'PGRST116') {
      throw new Error("Empresa no encontrada.");
    }
    throw new Error(formatErrorMessage(error));
  }
};

