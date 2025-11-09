/**
 * Utilidades de validación compartidas
 */

/**
 * Valida si una cadena es un UUID válido
 * @param {string} str - Cadena a validar
 * @returns {boolean} - true si es un UUID válido, false en caso contrario
 */
export const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Valida múltiples UUIDs
 * @param {...string} ids - IDs a validar
 * @returns {boolean} - true si todos son UUIDs válidos
 */
export const areValidUUIDs = (...ids) => {
  return ids.every(id => isValidUUID(id));
};

