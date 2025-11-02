
import { useContext } from 'react';
import { FavoritesContext } from '@/context/FavoritesContext';

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
    }
    return context;
};
