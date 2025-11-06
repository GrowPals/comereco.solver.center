/**
 * 🔑 UTILIDADES DE VALIDACIÓN DE UUIDs
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida si un string es un UUID válido
 * @param {string} uuid - UUID a validar
 * @returns {boolean}
 */
function isValidUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  return UUID_REGEX.test(uuid.trim());
}

/**
 * Valida y normaliza un UUID (lowercase)
 * @param {string} uuid - UUID a normalizar
 * @returns {string|null} UUID normalizado o null si es inválido
 */
function normalizeUuid(uuid) {
  if (!isValidUuid(uuid)) {
    return null;
  }

  return uuid.trim().toLowerCase();
}

/**
 * Valida un array de UUIDs
 * @param {string[]} uuids - Array de UUIDs
 * @returns {{ valid: string[], invalid: string[] }}
 */
function validateUuids(uuids) {
  const valid = [];
  const invalid = [];

  for (const uuid of uuids) {
    if (isValidUuid(uuid)) {
      valid.push(uuid);
    } else {
      invalid.push(uuid);
    }
  }

  return { valid, invalid };
}

module.exports = {
  isValidUuid,
  normalizeUuid,
  validateUuids,
  UUID_REGEX
};
