import { supabase } from '@/lib/customSupabaseClient';

// Cache simple para sesión (evita múltiples llamadas en el mismo tick)
let sessionCache = null;
let sessionCacheTime = 0;
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Helper optimizado para obtener sesión con cache temporal
 * Evita múltiples llamadas a getSession() en el mismo momento
 */
export const getCachedSession = async () => {
  const now = Date.now();
  
  // Si tenemos cache válido, retornarlo
  if (sessionCache && (now - sessionCacheTime) < CACHE_DURATION) {
    return sessionCache;
  }

  // Obtener sesión fresca
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    sessionCache = null;
    sessionCacheTime = 0;
    return { session: null, error };
  }

  // Actualizar cache
  sessionCache = { session, error: null };
  sessionCacheTime = now;
  
  return { session, error: null };
};

/**
 * Helper para obtener usuario autenticado con cache
 */
export const getCachedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

/**
 * Limpiar cache de sesión (útil después de login/logout)
 */
export const clearSessionCache = () => {
  sessionCache = null;
  sessionCacheTime = 0;
};

// Escuchar cambios de auth para limpiar cache
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(() => {
    clearSessionCache();
  });
}

