
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const RequisitionContext = createContext();

const initialState = {
    created_by: '', // CORREGIDO: Según documentación técnica oficial, el campo es created_by
    project_id: null,
    comments: '',
    items: [],
    templateName: '',
};

export const RequisitionProvider = ({ children }) => {
    const { user } = useSupabaseAuth();
    const { items: cartItems } = useCart();
    const [requisition, setRequisition] = useState(initialState);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (user && !isInitialized) {
            setRequisition(prev => ({
                ...prev,
                created_by: user.id,
                items: cartItems.map(item => ({ ...item, product_id: item.id }))
            }));
            setIsInitialized(true);
        }
    }, [user, cartItems, isInitialized]);
    
    const updateItemsFromCart = useCallback(() => {
        setRequisition(prev => ({
            ...prev,
            items: cartItems.map(item => ({...item, product_id: item.id}))
        }));
    }, [cartItems]);
    
    useEffect(() => {
        if(isInitialized) {
            updateItemsFromCart();
        }
    }, [cartItems, isInitialized, updateItemsFromCart]);
    
    const updateItemQuantity = (productId, quantity) => {
        setRequisition(prev => ({
            ...prev,
            items: prev.items.map(item => 
                item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
            ).filter(item => item.quantity > 0)
        }));
    };
    
    const removeItem = (productId) => {
        setRequisition(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== productId)
        }));
    };

    const resetRequisition = () => {
        setRequisition({
            ...initialState,
            created_by: user?.id || ''
        });
    };

    const value = useMemo(() => ({
        requisition,
        setRequisition,
        updateItemQuantity,
        removeItem,
        resetRequisition
    }), [requisition]);

    return (
        <RequisitionContext.Provider value={value}>
            {children}
        </RequisitionContext.Provider>
    );
};

export const useRequisition = () => {
    const context = useContext(RequisitionContext);
    if (!context) {
        throw new Error('useRequisition must be used within a RequisitionProvider');
    }
    return context;
};
