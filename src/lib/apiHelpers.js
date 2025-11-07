/**
 * Utilidades para validaciones comunes de API
 *
 * Centraliza validaciones y helpers para operaciones de API
 */

/**
 * Valida que el usuario esté autenticado
 * @param {string} userId - ID del usuario
 * @throws {Error} Si userId es inválido
 * @returns {string} userId validado
 *
 * @example
 * const userId = ensureAuthenticated(user?.id);
 * // Si user?.id es null, lanza error
 */
export const ensureAuthenticated = (userId) => {
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
};

/**
 * Valida que un ID sea válido (no vacío, no null, no undefined)
 * @param {string|number} id - ID a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @throws {Error} Si el ID es inválido
 * @returns {string|number} ID validado
 *
 * @example
 * const productId = ensureValidId(id, 'producto');
 * // Si id es null, lanza: "ID de producto inválido"
 */
export const ensureValidId = (id, fieldName = 'recurso') => {
  if (!id || id === '' || id === 'undefined' || id === 'null') {
    throw new Error(`ID de ${fieldName} inválido`);
  }
  return id;
};

/**
 * Valida que un objeto tenga las propiedades requeridas
 * @param {Object} obj - Objeto a validar
 * @param {string[]} requiredFields - Array de nombres de campos requeridos
 * @param {string} objectName - Nombre del objeto para el mensaje de error
 * @throws {Error} Si falta algún campo requerido
 *
 * @example
 * ensureRequiredFields(productData, ['name', 'price'], 'producto');
 * // Si falta 'name', lanza: "El campo 'name' es requerido en producto"
 */
export const ensureRequiredFields = (obj, requiredFields, objectName = 'objeto') => {
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new Error(`El campo '${field}' es requerido en ${objectName}`);
    }
  }
};

/**
 * Maneja errores de forma consistente y los re-lanza con formato mejorado
 * @param {Error} error - Error original
 * @param {string} context - Contexto donde ocurrió el error
 * @throws {Error} Error con mensaje mejorado
 *
 * @example
 * try {
 *   // operación
 * } catch (error) {
 *   handleApiError(error, 'fetchProducts');
 * }
 */
export const handleApiError = (error, context = 'operación') => {
  console.error(`Error en ${context}:`, error);

  // Si es un error de Supabase, extraer mensaje más útil
  if (error?.message) {
    throw new Error(`Error en ${context}: ${error.message}`);
  }

  throw new Error(`Error desconocido en ${context}`);
};
