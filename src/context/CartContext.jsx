
import React, { createContext, useContext } from 'react';
import { useCart as useCartHook } from '@/hooks/useCart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const cartHook = useCartHook();
    return <CartContext.Provider value={cartHook}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe ser usado dentro de un CartProvider');
    }
    return context;
};
