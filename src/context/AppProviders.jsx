
import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AlertProvider } from '@/context/AlertContext';

// Crear una instancia de QueryClient optimizada para rendimiento
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - datos frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tiempo en cache (antes cacheTime)
      refetchOnWindowFocus: false, // No refetch automático al enfocar ventana
      refetchOnReconnect: true, // Refetch al reconectar
      retry: (failureCount, error) => {
        // No retry en errores 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry hasta 2 veces para errores de red/server
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // No retry en mutaciones
    },
  },
});

const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SupabaseAuthProvider>
          <AlertProvider>
            <FavoritesProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </FavoritesProvider>
          </AlertProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
