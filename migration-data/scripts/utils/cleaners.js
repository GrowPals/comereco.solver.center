/**
 * 🧹 UTILIDADES DE LIMPIEZA DE DATOS
 */

/**
 * Limpia un string removiendo caracteres problemáticos para TSV
 * @param {*} value - Valor a limpiar
 * @returns {string|null} String limpio o null
 */
function cleanString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  let str = String(value)
    .replace(/\t/g, ' ')      // Tabs → espacios
    .replace(/\n/g, ' ')      // Newlines → espacios
    .replace(/\r/g, '')       // Carriage returns → nada
    .replace(/\s+/g, ' ')     // Múltiples espacios → uno solo
    .trim();

  return str === '' ? null : str;
}

/**
 * Limpia y valida un número
 * @param {*} value - Valor a convertir
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number}
 */
function cleanNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Limpia y valida un entero
 * @param {*} value - Valor a convertir
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number}
 */
function cleanInteger(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const num = parseInt(value);
  return isNaN(num) ? defaultValue : Math.floor(num);
}

/**
 * Limpia y valida un boolean
 * @param {*} value - Valor a convertir
 * @param {boolean} defaultValue - Valor por defecto
 * @returns {boolean}
 */
function cleanBoolean(value, defaultValue = false) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes';
}

/**
 * Trunca un string a una longitud máxima
 * @param {string} value - String a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
function truncateString(value, maxLength = 1000) {
  if (!value) return '';
  const str = String(value);
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Normaliza un SKU removiendo caracteres especiales
 * @param {string} sku - SKU a normalizar
 * @returns {string}
 */
function normalizeSku(sku) {
  if (!sku) return '';

  return String(sku)
    .trim()
    .replace(/\t/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  cleanString,
  cleanNumber,
  cleanInteger,
  cleanBoolean,
  truncateString,
  normalizeSku
};
