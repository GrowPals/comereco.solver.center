
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast.js';
import logger from '@/utils/logger';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

export const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // Cargar favoritos desde Supabase cuando el usuario está disponible
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const favoriteIds = new Set(data.map(fav => fav.product_id));
        setFavorites(favoriteIds);
      } catch (error) {
        logger.error("Failed to load favorites from Supabase", error);
        setFavorites(new Set());
        toast({
          variant: "destructive",
          title: "Error al cargar favoritos",
          description: "No se pudieron cargar tus productos favoritos.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, toast]);

  const toggleFavorite = useCallback(async (productId, productName) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar tus favoritos.",
      });
      return;
    }

    const isCurrentlyFavorite = favorites.has(productId);
    const nextFavorites = new Set(favorites);

    if (isCurrentlyFavorite) {
      // Eliminar de favoritos
      nextFavorites.delete(productId);
      setFavorites(nextFavorites); // Actualización optimista

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, product_id: productId });

      if (error) {
        logger.error("Failed to remove favorite from Supabase", error);
        nextFavorites.add(productId); // Revertir si hay error
        setFavorites(nextFavorites);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo eliminar "${productName}" de tus favoritos.`,
        });
      } else {
        toast({
          variant: "info",
          title: "Eliminado de Favoritos",
          description: `"${productName}" ya no está en tus favoritos.`,
        });
      }
    } else {
      // Añadir a favoritos
      nextFavorites.add(productId);
      setFavorites(nextFavorites); // Actualización optimista

      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        logger.error("Failed to add favorite to Supabase", error);
        nextFavorites.delete(productId); // Revertir si hay error
        setFavorites(nextFavorites);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo añadir "${productName}" a tus favoritos.`,
        });
      } else {
        toast({
          variant: "success",
          title: "Añadido a Favoritos",
          description: `¡Has añadido "${productName}" a tus favoritos!`,
        });
      }
    }
  }, [user, favorites, toast]);
  
  const isFavorite = (productId) => favorites.has(productId);

  const value = { favorites: Array.from(favorites), toggleFavorite, isFavorite, loading };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
