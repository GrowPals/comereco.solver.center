
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/useToast';
import logger from '@/utils/logger';


const getFavoritesAPI = async (userId) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', userId);
    
    if (error) {
        logger.error('Error fetching favorites:', error);
        throw error;
    }
    
    // Verificar que los productos aún existen y están activos
    const productIds = data.map(fav => fav.product_id);
    if (productIds.length === 0) {
        return new Set();
    }

    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds)
        .eq('is_active', true);

    if (productsError) {
        logger.warn('Error verificando productos favoritos:', productsError);
        // Retornar todos los IDs aunque haya error en la verificación
        return new Set(productIds);
    }

    // Filtrar solo productos activos
    const activeProductIds = new Set(products.map(p => p.id));
    
    // Eliminar productos inactivos de favoritos silenciosamente
    const inactiveProductIds = productIds.filter(id => !activeProductIds.has(id));
    if (inactiveProductIds.length > 0) {
        logger.warn('Productos inactivos encontrados en favoritos:', inactiveProductIds);
        await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .in('product_id', inactiveProductIds);
    }

    return activeProductIds;
};

const addFavoriteAPI = async ({ userId, productId }) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
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

    const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, product_id: productId });
    
    if (error) {
        logger.error('Error adding favorite:', error);
        throw error;
    }
};

const removeFavoriteAPI = async ({ userId, productId }) => {
    // Validar que userId existe
    if (!userId) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: userId, product_id: productId });
    
    if (error) {
        logger.error('Error removing favorite:', error);
        throw error;
    }
};

export const useFavorites = () => {
    const queryClient = useQueryClient();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();

    const { data: favorites = new Set(), isLoading: isLoadingFavorites, refetch } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error('Usuario no autenticado');
            return getFavoritesAPI(user.id);
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutos - favoritos cambian poco
        gcTime: 1000 * 60 * 15, // 15 minutos en cache
    });
    
    const mutationOptions = {
        onMutate: async (productId) => {
            const currentUserId = user?.id;
            if (!currentUserId) {
                throw new Error('Usuario no autenticado');
            }

            await queryClient.cancelQueries({queryKey: ['favorites', currentUserId]});
            const previousFavorites = queryClient.getQueryData(['favorites', currentUserId]);

            queryClient.setQueryData(['favorites', currentUserId], (old) => {
                // Manejar el caso de que old sea undefined
                const newFavorites = new Set(old || new Set());
                if (newFavorites.has(productId)) {
                    newFavorites.delete(productId);
                } else {
                    newFavorites.add(productId);
                }
                return newFavorites;
            });

            return { previousFavorites, userId: currentUserId };
        },
        onError: (err, productId, context) => {
            // Usar userId del contexto en lugar del estado actual
            const targetUserId = context?.userId || user?.id;
            if (context?.previousFavorites && targetUserId) {
                queryClient.setQueryData(['favorites', targetUserId], context.previousFavorites);
            }
            toast({ variant: 'destructive', title: 'Error', description: "No se pudo actualizar tus favoritos." });
        },
        onSettled: (data, error, variables, context) => {
            // Usar userId del contexto en lugar del estado actual
            const targetUserId = context?.userId || user?.id;
            if (targetUserId) {
                queryClient.invalidateQueries({queryKey: ['favorites', targetUserId]});
            }
        }
    };

    const addMutation = useMutation({ 
        mutationFn: (productId) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            return addFavoriteAPI({ userId: user.id, productId });
        }, 
        ...mutationOptions 
    });
    
    const removeMutation = useMutation({ 
        mutationFn: (productId) => {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }
            return removeFavoriteAPI({ userId: user.id, productId });
        }, 
        ...mutationOptions 
    });

    const toggleFavorite = (productId, productName) => {
        if (!user) {
            toast({ variant: "destructive", title: "Inicia sesión", description: "Debes iniciar sesión para guardar tus favoritos."});
            return;
        }
        if (favorites.has(productId)) {
            removeMutation.mutate(productId);
        } else {
            addMutation.mutate(productId);
        }
    };
    
    const isFavorite = (productId) => favorites.has(productId);

    return {
        favorites: Array.from(favorites),
        isLoadingFavorites,
        toggleFavorite,
        isFavorite,
        refetch,
    };
};
