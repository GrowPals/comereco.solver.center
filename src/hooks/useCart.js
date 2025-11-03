
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/useToast';
import { useState, useMemo, useCallback } from 'react';
import logger from '@/utils/logger';

const fetchCartAPI = async (userId) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
    }

    // FIX: Evitar embeds ambiguos según REFERENCIA_TECNICA_BD_SUPABASE.md
    // Obtener items del carrito primero
    const { data: cartItems, error: cartError } = await supabase
        .from('user_cart_items')
        .select('quantity, product_id')
        .eq('user_id', userId);
    
    if (cartError) {
        logger.error('Error fetching cart items:', cartError);
        throw cartError;
    }
    if (!cartItems || cartItems.length === 0) return [];

    // Obtener productos por separado (solo productos activos)
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true); // Solo productos activos
    
    if (productsError) {
        logger.error('Error fetching products for cart:', productsError);
        throw productsError;
    }

    // Combinar datos
    const productsMap = {};
    products?.forEach(p => { productsMap[p.id] = p; });

    // Filtrar productos que no se encontraron o están inactivos
    const validItems = cartItems
        .map(item => ({
            ...productsMap[item.product_id],
            quantity: item.quantity
        }))
        .filter(item => item.id); // Filtrar productos que no se encontraron

    // Si hay productos eliminados del catálogo, eliminarlos del carrito
    const invalidProductIds = cartItems
        .filter(item => !productsMap[item.product_id])
        .map(item => item.product_id);
    
    if (invalidProductIds.length > 0) {
        logger.warn('Productos eliminados del catálogo encontrados en carrito:', invalidProductIds);
        // Eliminar productos inválidos del carrito silenciosamente
        await supabase
            .from('user_cart_items')
            .delete()
            .eq('user_id', userId)
            .in('product_id', invalidProductIds);
    }

    return validItems;
};

const upsertCartItemAPI = async ({ userId, productId, quantity }) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
    }

    // Validar que quantity es positiva
    if (quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
    }

    // Verificar que el producto existe y está activo
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        throw new Error('Producto no encontrado');
    }

    if (!product.is_active) {
        throw new Error('El producto no está disponible');
    }

    const { data, error } = await supabase
        .from('user_cart_items')
        .upsert({ user_id: userId, product_id: productId, quantity }, {
            onConflict: 'user_id,product_id'
        })
        .select();

    if (error) {
        logger.error('Error upserting cart item:', error);
        throw error;
    }
    return data;
};

const removeCartItemAPI = async ({ userId, productId }) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
        .from('user_cart_items')
        .delete()
        .match({ user_id: userId, product_id: productId });
    
    if (error) {
        logger.error('Error removing cart item:', error);
        throw error;
    }
};

const clearCartAPI = async () => {
    // Validar sesión antes de hacer queries
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Usuario no autenticado');
    }
    
    const { data, error } = await supabase.rpc('clear_user_cart');
    if (error) {
        logger.error('Error clearing cart:', error);
        throw error;
    }
    // La función retorna void, pero manejamos el error correctamente
    return data;
}

export const useCart = () => {
    const { user } = useSupabaseAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isCartOpen, setIsCartOpen] = useState(false);

    const { data: items = [], isLoading, refetch } = useQuery({
        queryKey: ['cart', user?.id],
        queryFn: () => fetchCartAPI(user.id),
        enabled: !!user,
        staleTime: 1000 * 30, // 30 segundos - carrito puede cambiar frecuentemente
        refetchOnWindowFocus: true, // Refetch al enfocar para mantener sincronizado
    });
    
    const mutationOptions = {
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });
            const previousCart = queryClient.getQueryData(['cart', user?.id]);
            return { previousCart };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['cart', user?.id], context.previousCart);
            toast({ variant: 'destructive', title: 'Error en el carrito', description: err.message });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
        },
    };

    const addToCartMutation = useMutation({
        mutationFn: (product) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            const existingItem = items.find(item => item.id === product.id);
            const quantity = (existingItem?.quantity || 0) + 1;
            return upsertCartItemAPI({ userId: user.id, productId: product.id, quantity });
        },
        ...mutationOptions,
        onSuccess: () => {
          toast({ title: '¡Producto agregado!'});
        }
    });

    const updateQuantityMutation = useMutation({
        mutationFn: ({ productId, quantity }) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            if (quantity <= 0) {
                return removeCartItemAPI({ userId: user.id, productId });
            }
            return upsertCartItemAPI({ userId: user.id, productId, quantity });
        },
        ...mutationOptions,
    });

    const removeFromCartMutation = useMutation({
        mutationFn: (productId) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            return removeCartItemAPI({ userId: user.id, productId });
        },
        ...mutationOptions,
         onSuccess: () => {
          toast({ title: 'Producto eliminado', variant: 'info'});
        }
    });

    const clearCartMutation = useMutation({
        mutationFn: clearCartAPI,
        ...mutationOptions,
        onSuccess: () => {
            toast({ title: 'Carrito vaciado' });
            // Invalidar todas las queries de cart para asegurar sincronización
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
    });

    const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const vat = useMemo(() => subtotal * 0.16, [subtotal]);
    const total = useMemo(() => subtotal + vat, [subtotal, vat]);

    const getItemQuantity = useCallback((productId) => {
        const item = items.find(item => item.id === productId);
        return item?.quantity || 0;
    }, [items]);

    const addToCartHandler = (product) => addToCartMutation.mutate(product);
    const updateQuantityHandler = (productId, quantity) => updateQuantityMutation.mutate({ productId, quantity });
    const removeFromCartHandler = (productId) => removeFromCartMutation.mutate(productId);
    const clearCartHandler = () => clearCartMutation.mutate();

    return {
        items,
        isLoading,
        refetch,
        isCartOpen,
        setIsCartOpen,
        toggleCart: () => setIsCartOpen(prev => !prev),
        addToCart: addToCartHandler,
        removeFromCart: removeFromCartHandler,
        updateQuantity: updateQuantityHandler,
        clearCart: clearCartHandler,
        getItemQuantity,
        totalItems,
        subtotal,
        vat,
        total
    };
};
