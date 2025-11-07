import { supabase } from '@/lib/customSupabaseClient';
import { getCompanyScopeOverride, COMPANY_SCOPE_GLOBAL } from '@/lib/companyScopeStore';

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

/**
 * Helper optimizado para obtener company_id del usuario actual
 * Cachea el resultado para evitar queries repetidas en el mismo tick
 */
let companyIdCache = null;
let companyIdCacheTime = 0;
const COMPANY_ID_CACHE_DURATION = 10000; // 10 segundos

export const getCachedCompanyId = async () => {
  const now = Date.now();
  
  // Si tenemos cache válido, retornarlo
  if (companyIdCache && (now - companyIdCacheTime) < COMPANY_ID_CACHE_DURATION) {
    return companyIdCache;
  }

  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    companyIdCache = null;
    companyIdCacheTime = 0;
    return { companyId: null, error: sessionError };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    companyIdCache = null;
    companyIdCacheTime = 0;
    return { companyId: null, error: profileError };
  }

  companyIdCache = { companyId: profile.company_id, error: null };
  companyIdCacheTime = now;
  
  return companyIdCache;
};

// Limpiar cache de company_id cuando cambia la sesión
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(() => {
    companyIdCache = null;
    companyIdCacheTime = 0;
  });
}

export const getScopedCompanyId = async ({ allowGlobal = false } = {}) => {
  const override = getCompanyScopeOverride();

  if (override === COMPANY_SCOPE_GLOBAL) {
    if (allowGlobal) {
      return { companyId: null, error: null, isGlobal: true };
    }
    return { ...(await getCachedCompanyId()), isGlobal: false };
  }

  if (override) {
    return { companyId: override, error: null, isGlobal: false };
  }

  const fallback = await getCachedCompanyId();
  return { ...fallback, isGlobal: false };
};

export const ensureScopedCompanyId = async () => {
  const override = getCompanyScopeOverride();
  if (override === COMPANY_SCOPE_GLOBAL) {
    return {
      companyId: null,
      error: {
        message: 'Selecciona una empresa específica para continuar.'
      }
    };
  }

  if (override) {
    return { companyId: override, error: null };
  }

  return getCachedCompanyId();
};
