
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/useToast';
import { useState } from 'react';
import logger from '@/utils/logger';

const fetchCartAPI = async (userId) => {
    const { data, error } = await supabase
        .from('user_cart_items')
        .select(`quantity, product:products(*)`)
        .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(item => ({ ...item.product, quantity: item.quantity }));
};

const upsertCartItemAPI = async ({ userId, productId, quantity }) => {
    const { data, error } = await supabase
        .from('user_cart_items')
        .upsert({ user_id: userId, product_id: productId, quantity })
        .select();

    if (error) throw error;
    return data;
};

const removeCartItemAPI = async ({ userId, productId }) => {
    const { error } = await supabase
        .from('user_cart_items')
        .delete()
        .match({ user_id: userId, product_id: productId });
    
    if (error) throw error;
};

const clearCartAPI = async () => {
    const { error } = await supabase.rpc('clear_user_cart');
    if (error) throw error;
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
             if (quantity <= 0) {
                return removeCartItemAPI({ userId: user.id, productId });
            }
            return upsertCartItemAPI({ userId: user.id, productId, quantity });
        },
        ...mutationOptions,
    });

    const removeFromCartMutation = useMutation({
        mutationFn: (productId) => removeCartItemAPI({ userId: user.id, productId }),
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
        }
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const vat = subtotal * 0.16;
    const total = subtotal + vat;

    return {
        items,
        isLoading,
        refetch,
        isCartOpen,
        setIsCartOpen,
        toggleCart: () => setIsCartOpen(prev => !prev),
        addToCart: addToCartMutation.mutate,
        removeFromCart: removeFromCartMutation.mutate,
        updateQuantity: updateQuantityMutation.mutate,
        clearCart: clearCartMutation.mutate,
        totalItems,
        subtotal,
        vat,
        total
    };
};
