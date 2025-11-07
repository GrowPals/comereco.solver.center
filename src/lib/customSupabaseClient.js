import { createClient } from '@supabase/supabase-js';
import logger from '@/utils/logger';

// Obtener variables de entorno - NO usar valores hardcodeados en producción
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  let errorMessage = '❌ Variables de entorno de Supabase no configuradas.\n\n';

  if (import.meta.env.PROD) {
    // En producción (Vercel), dar instrucciones específicas
    errorMessage += '🔧 SOLUCIÓN PARA VERCEL:\n\n';
    errorMessage += '1. Ve a tu proyecto en Vercel Dashboard\n';
    errorMessage += '2. Settings → Environment Variables\n';
    errorMessage += '3. Agrega estas variables:\n\n';
    errorMessage += '   • VITE_SUPABASE_URL = https://azjaehrdzdfgrumbqmuc.supabase.co\n';
    errorMessage += '   • VITE_SUPABASE_ANON_KEY = [tu clave anon de Supabase]\n\n';
    errorMessage += '4. Redeploy el proyecto\n\n';
    errorMessage += '📖 Revisa el README (sección "Despliegue en Vercel") para más detalles.';
  } else {
    // En desarrollo local
    errorMessage += 'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env\n';
    errorMessage += 'Copia .env.example a .env y completa los valores.';
  }

  logger.error('⚠️ Supabase configuration error', errorMessage);

  // Crear error con mensaje más descriptivo
  const error = new Error(errorMessage);
  error.name = 'ConfigurationError';
  throw error;
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
