/**
 * Hook para manejar redirección automática cuando expira la sesión
 * Se integra con React Query para interceptar errores de autenticación
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { getErrorContext } from '@/utils/errorHandler';

export const useSessionExpirationHandler = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useSupabaseAuth();

  useEffect(() => {
    // Interceptar errores de queries
    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event?.query?.state?.status === 'error') {
        const error = event?.query?.state?.error;
        if (error) {
          const errorContext = getErrorContext(error);
          if (errorContext?.type === 'auth') {
            // Limpiar cache y redirigir
            queryClient.clear();
            signOut();
            navigate('/login', { 
              state: { 
                from: window.location.pathname,
                message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
              },
              replace: true 
            });
          }
        }
      }
    });

    // Interceptar errores de mutaciones
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'updated' && event?.mutation?.state?.status === 'error') {
        const error = event?.mutation?.state?.error;
        if (error) {
          const errorContext = getErrorContext(error);
          if (errorContext?.type === 'auth') {
            // Limpiar cache y redirigir
            queryClient.clear();
            signOut();
            navigate('/login', { 
              state: { 
                from: window.location.pathname,
                message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
              },
              replace: true 
            });
          }
        }
      }
    });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [navigate, queryClient, signOut]);
};

export default useSessionExpirationHandler;

