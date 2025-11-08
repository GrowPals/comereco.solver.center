
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/useToast';
import { useMemo, useCallback } from 'react';
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
        .select('quantity, product_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    
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
            quantity: item.quantity,
            created_at: item.created_at
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
    const { data: items = [], isLoading, refetch } = useQuery({
        queryKey: ['cart', user?.id],
        queryFn: () => fetchCartAPI(user.id),
        enabled: !!user,
        staleTime: 1000 * 30, // 30 segundos - carrito puede cambiar frecuentemente
        refetchOnWindowFocus: true, // Refetch al enfocar para mantener sincronizado
    });

    const mutationOptions = {
        onError: (err, variables, context) => {
            // Usar userId del contexto en lugar del estado actual
            const targetUserId = context?.userId || user?.id;
            if (context?.previousCart && targetUserId) {
                queryClient.setQueryData(['cart', targetUserId], context.previousCart);
            }
            toast({ variant: 'destructive', title: 'Error en el carrito', description: err.message });
        },
        onSettled: (data, error, variables, context) => {
            // Usar userId del contexto en lugar del estado actual
            const targetUserId = context?.userId || user?.id;
            if (targetUserId) {
                queryClient.invalidateQueries({ queryKey: ['cart', targetUserId] });
            }
        },
    };

    const addToCartMutation = useMutation({
        mutationFn: ({ product, quantity = 1 }) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error('Cantidad inválida');
            }
            const existingItem = items.find(item => item.id === product.id);
            const newQuantity = (existingItem?.quantity || 0) + quantity;
            return upsertCartItemAPI({ userId: user.id, productId: product.id, quantity: newQuantity });
        },
        onMutate: async ({ product, quantity = 1 }) => {
            const currentUserId = user?.id;
            if (!currentUserId) {
                throw new Error('Usuario no autenticado');
            }

            // Validar que el producto tenga los campos necesarios
            if (!product?.id || product?.price == null) {
                throw new Error('Datos del producto inválidos');
            }

            await queryClient.cancelQueries({ queryKey: ['cart', currentUserId] });
            const previousCart = queryClient.getQueryData(['cart', currentUserId]) || [];

            const existingIndex = previousCart.findIndex(item => item.id === product.id);
            let optimisticCart;

            if (existingIndex !== -1) {
                optimisticCart = previousCart.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                optimisticCart = [
                    ...previousCart,
                    {
                        ...product,
                        quantity,
                    },
                ];
            }

            queryClient.setQueryData(['cart', currentUserId], optimisticCart);
            return { previousCart, userId: currentUserId };
        },
        ...mutationOptions,
        onSuccess: () => {}
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
        onMutate: async ({ productId, quantity }) => {
            if (!user?.id) return { previousCart: [] };
            await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });
            const previousCart = queryClient.getQueryData(['cart', user?.id]) || [];

            let optimisticCart;
            if (quantity <= 0) {
                optimisticCart = previousCart.filter(item => item.id !== productId);
            } else {
                optimisticCart = previousCart.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                );
            }

            queryClient.setQueryData(['cart', user?.id], optimisticCart);
            return { previousCart };
        },
        ...mutationOptions,
        onSuccess: () => {}
    });

    const removeFromCartMutation = useMutation({
        mutationFn: (productId) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            return removeCartItemAPI({ userId: user.id, productId });
        },
        onMutate: async (productId) => {
            if (!user?.id) return { previousCart: [] };
            await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });
            const previousCart = queryClient.getQueryData(['cart', user?.id]) || [];

            const optimisticCart = previousCart.filter(item => item.id !== productId);
            queryClient.setQueryData(['cart', user?.id], optimisticCart);

            return { previousCart };
        },
        ...mutationOptions,
         onSuccess: () => {}
    });

    const clearCartMutation = useMutation({
        mutationFn: clearCartAPI,
        onMutate: async () => {
            if (!user?.id) return { previousCart: [] };
            await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });
            const previousCart = queryClient.getQueryData(['cart', user?.id]) || [];
            queryClient.setQueryData(['cart', user?.id], []);
            return { previousCart };
        },
        ...mutationOptions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
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

    const addToCartHandler = (product, quantity = 1) => addToCartMutation.mutate({ product, quantity });
    const updateQuantityHandler = (productId, quantity) => updateQuantityMutation.mutate({ productId, quantity });
    const removeFromCartHandler = (productId) => removeFromCartMutation.mutate(productId);
    const clearCartHandler = () => clearCartMutation.mutate();

    return {
        items,
        isLoading,
        refetch,
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
