
import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SupabaseAuthProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </FavoritesProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
