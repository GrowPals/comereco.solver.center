import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno - NO usar valores hardcodeados en producción
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Variables de entorno de Supabase no configuradas. ' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env';
  
  if (import.meta.env.PROD) {
    throw new Error(errorMessage);
  } else {
    console.error('⚠️', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Cliente de Supabase optimizado y configurado según mejores prácticas
 * - Persistencia de sesión habilitada
 * - Auto-refresh de tokens habilitado
 * - Detección de sesión en URL habilitada
 * - Configuración de real-time optimizada
 * - Timeout configurado para evitar requests colgados
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'comereco-auth',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'comereco-webapp@1.0.0'
    },
    fetch: (url, options = {}) => {
      // Timeout de 30 segundos para todas las requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  db: {
    schema: 'public'
  }
});