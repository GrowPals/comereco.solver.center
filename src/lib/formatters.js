/**
 * Utilidades centralizadas para formateo de números y moneda
 *
 * Este archivo centraliza todo el formateo de números para mantener
 * consistencia en toda la aplicación y facilitar cambios futuros.
 */

/**
 * Formatea un número como precio con dos decimales
 * @param {number|string} value - Valor a formatear
 * @returns {string} Número formateado (ej: "1,234.56")
 *
 * @example
 * formatPrice(1234.5) // "1,234.50"
 * formatPrice("1234.567") // "1,234.57"
 */
export const formatPrice = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formatea un número como moneda con símbolo $ y dos decimales
 * @param {number|string} value - Valor a formatear
 * @returns {string} Moneda formateada (ej: "$1,234.56")
 *
 * @example
 * formatCurrency(1234.5) // "$1,234.50"
 * formatCurrency("1234.567") // "$1,234.57"
 */
export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(num);
};

/**
 * Formatea un número entero sin decimales
 * @param {number|string} value - Valor a formatear
 * @returns {string} Número formateado (ej: "1,234")
 *
 * @example
 * formatNumber(1234) // "1,234"
 * formatNumber("1234.99") // "1,235"
 */
export const formatNumber = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('es-MX');
};

/**
 * Formatea un número como porcentaje con dos decimales
 * @param {number|string} value - Valor a formatear (0-100)
 * @returns {string} Porcentaje formateado (ej: "12.34%")
 *
 * @example
 * formatPercentage(12.345) // "12.35%"
 * formatPercentage("12.3") // "12.30%"
 */
export const formatPercentage = (value) => {
  const num = Number(value) || 0;
  return `${num.toFixed(2)}%`;
};

/**
 * Formatea un número compacto (K, M, B)
 * @param {number|string} value - Valor a formatear
 * @returns {string} Número compacto (ej: "1.2K", "3.5M")
 *
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 */
export const formatCompactNumber = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-MX', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
};
