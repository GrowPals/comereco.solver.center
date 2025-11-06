/**
 * 📅 UTILIDADES DE FORMATO DE FECHAS
 */

/**
 * Formatea una fecha a formato PostgreSQL (YYYY-MM-DD HH:MM:SS)
 * @param {Date|string|null} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatTimestamp(date = null) {
  const d = date ? new Date(date) : new Date();

  if (isNaN(d.getTime())) {
    // Fecha inválida, usar ahora
    return formatTimestamp(null);
  }

  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Formatea solo la fecha (YYYY-MM-DD)
 * @param {Date|string|null} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date = null) {
  const d = date ? new Date(date) : new Date();

  if (isNaN(d.getTime())) {
    return formatDate(null);
  }

  return d.toISOString().slice(0, 10);
}

/**
 * Convierte fecha ISO a timestamp PostgreSQL
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Timestamp PostgreSQL
 */
function isoToTimestamp(isoDate) {
  if (!isoDate) return formatTimestamp();

  try {
    const date = new Date(isoDate);
    return formatTimestamp(date);
  } catch (e) {
    return formatTimestamp();
  }
}

module.exports = {
  formatTimestamp,
  formatDate,
  isoToTimestamp
};
