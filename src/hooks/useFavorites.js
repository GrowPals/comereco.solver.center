
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/useToast';
import logger from '@/utils/logger';


const getFavoritesAPI = async (userId) => {
    const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', userId);
    if (error) throw error;
    return new Set(data.map(fav => fav.product_id));
};

const addFavoriteAPI = async ({ userId, productId }) => {
    const { error } = await supabase.from('user_favorites').insert({ user_id: userId, product_id: productId });
    if (error) throw error;
};

const removeFavoriteAPI = async ({ userId, productId }) => {
    const { error } = await supabase.from('user_favorites').delete().match({ user_id: userId, product_id: productId });
    if (error) throw error;
};

export const useFavorites = () => {
    const queryClient = useQueryClient();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();

    const { data: favorites = new Set(), isLoading: isLoadingFavorites, refetch } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => getFavoritesAPI(user.id),
        enabled: !!user,
    });
    
    const mutationOptions = {
        onMutate: async (productId) => {
            await queryClient.cancelQueries({queryKey: ['favorites', user.id]});
            const previousFavorites = queryClient.getQueryData(['favorites', user.id]);
            queryClient.setQueryData(['favorites', user.id], (old) => {
                const newFavorites = new Set(old);
                if (newFavorites.has(productId)) {
                    newFavorites.delete(productId);
                } else {
                    newFavorites.add(productId);
                }
                return newFavorites;
            });
            return { previousFavorites };
        },
        onError: (err, productId, context) => {
            queryClient.setQueryData(['favorites', user.id], context.previousFavorites);
            toast({ variant: 'destructive', title: 'Error', description: "No se pudo actualizar tus favoritos." });
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['favorites', user.id]});
        }
    };

    const addMutation = useMutation({ mutationFn: (productId) => addFavoriteAPI({ userId: user.id, productId }), ...mutationOptions });
    const removeMutation = useMutation({ mutationFn: (productId) => removeFavoriteAPI({ userId: user.id, productId }), ...mutationOptions });

    const toggleFavorite = (productId) => {
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
