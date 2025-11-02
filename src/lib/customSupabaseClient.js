import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://azjaehrdzdfgrumbqmuc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amFlaHJkemRmZ3J1bWJxbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQwNDIsImV4cCI6MjA3NzQ4MDA0Mn0.DVhyeFbF0egeLWKwUQiM8wL5fpeO4WtDHT6Zlz9vZo8';

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.PROD) {
    console.error('⚠️ Variables de entorno de Supabase no configuradas.');
  } else {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas. Usando valores por defecto.');
  }
}

/**
 * Cliente de Supabase optimizado y configurado según mejores prácticas
 * - Persistencia de sesión habilitada
 * - Auto-refresh de tokens habilitado
 * - Detección de sesión en URL habilitada
 * - Configuración de real-time optimizada
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'comereco-auth'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'comereco-webapp@1.0.0'
    }
  }
});