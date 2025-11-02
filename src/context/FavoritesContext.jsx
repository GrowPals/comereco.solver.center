
import React, { createContext, useContext } from 'react';
import { useFavorites as useFavoritesHook } from '@/hooks/useFavorites';

export const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const favoritesHook = useFavoritesHook();
  return (
    <FavoritesContext.Provider value={favoritesHook}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
    }
    return context;
};
