/**
 * Configuración global de la aplicación
 * Centraliza todos los valores hardcodeados para mejor mantenibilidad
 */

// Límites de paginación
export const PAGINATION = {
  SEARCH_LIMIT: 5,
  DASHBOARD_LIMIT: 5,
  PRODUCT_HISTORY_LIMIT: 10,
  RELATED_PRODUCTS_LIMIT: 8,
  PROJECTS_LIMIT: 50,
  RESTOCK_RULES_LIMIT: 1,
};

// Tiempos de animación (en milisegundos)
export const ANIMATION = {
  RIPPLE_DURATION: 600,
  TOAST_DURATION: 200,
  INTERACTION_DEBOUNCE: 200,
};

// Breakpoints responsivos
export const BREAKPOINTS = {
  MOBILE: 1024,
  TABLET: 768,
  DESKTOP_BASE: 1280,
  DESKTOP_MD: 1440,
  DESKTOP_LG: 1600,
  DESKTOP_XL: 1760,
};

// Configuración de reintentos
export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // ms
  BACKOFF_MULTIPLIER: 2,
};

// Configuración de timeouts
export const TIMEOUTS = {
  SUPABASE_REQUEST: 30000, // 30 segundos
  SESSION_CHECK: 5000, // 5 segundos
};
