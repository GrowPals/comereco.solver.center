
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/customSupabaseClient';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import EmptyState from '@/components/EmptyState';
import logger from '@/utils/logger';

// Función para obtener productos favoritos por IDs
const fetchFavoriteProducts = async (productIds) => {
    if (!productIds || productIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) {
        logger.error('Error fetching favorite products:', error);
        throw new Error('No se pudieron cargar tus productos favoritos');
    }

    return data || [];
};

const FavoritesPage = () => {
    const navigate = useNavigate();
    const { favorites, isLoadingFavorites } = useFavorites();

    // Query para obtener los productos completos de los favoritos
    const { data: favoriteProducts = [], isLoading: isLoadingProducts, isError } = useQuery({
        queryKey: ['favoriteProducts', favorites],
        queryFn: () => fetchFavoriteProducts(favorites),
        enabled: favorites.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    // Combinamos ambos estados de loading
    const isLoading = isLoadingFavorites || (favorites.length > 0 && isLoadingProducts);

    // Memoizar conteo
    const favoriteCount = useMemo(() => favoriteProducts.length, [favoriteProducts]);

    // Estados de la UI
    if (isLoading) {
        return (
            <>
                <Helmet><title>{`Mis Favoritos - ComerECO`}</title></Helmet>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header Skeleton */}
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-md">
                                    <Star className="h-7 w-7 text-amber-600" aria-hidden="true" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1">
                                        Mis <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Favoritos</span>
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                        <p className="text-base sm:text-lg text-slate-600">Cargando tus productos...</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                            {[...Array(10)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Estado de error
    if (isError) {
        return (
            <>
                <Helmet><title>{`Mis Favoritos - ComerECO`}</title></Helmet>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md border-2 border-red-100">
                        <EmptyState
                            icon={AlertCircle}
                            title="Error al Cargar Favoritos"
                            description="No pudimos cargar tus productos favoritos. Por favor, inténtalo de nuevo."
                            actionButton={
                                <Button onClick={() => window.location.reload()} size="lg" className="shadow-lg hover:shadow-xl">
                                    Reintentar
                                </Button>
                            }
                        />
                    </div>
                </div>
            </>
        );
    }

    // Estado vacío - No hay favoritos
    if (favoriteCount === 0) {
        return (
            <>
                <Helmet><title>Mis Favoritos - ComerECO</title></Helmet>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md border-2 border-slate-200">
                        <EmptyState
                            icon={Star}
                            title="Aún no tienes favoritos"
                            description="Explora el catálogo y marca los productos que más te gustan para encontrarlos aquí fácilmente."
                            actionButton={
                                <Button onClick={() => navigate('/catalog')} size="lg" className="shadow-lg hover:shadow-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    Explorar Catálogo
                                </Button>
                            }
                        />
                    </div>
                </div>
            </>
        );
    }

    // Estado con productos favoritos
    return (
        <>
            <Helmet><title>{`Mis Favoritos (${favoriteCount}) - ComerECO`}</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-md">
                                <Star className="h-7 w-7 text-amber-600 fill-amber-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1">
                                    Mis <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Favoritos</span>
                                </h1>
                                <p className="text-base sm:text-lg text-slate-600">
                                    {favoriteCount} {favoriteCount === 1 ? 'producto guardado' : 'productos guardados'}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/catalog')}
                            size="lg"
                            variant="outline"
                            className="shadow-md hover:shadow-lg whitespace-nowrap border-2"
                        >
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Seguir Explorando
                        </Button>
                    </header>

                    {/* Info Card */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Star className="h-5 w-5 text-amber-600 fill-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Tus productos favoritos</h3>
                                <p className="text-sm text-slate-600">
                                    Estos son los productos que has marcado como favoritos. Puedes agregarlos rápidamente a tu carrito o quitarlos de favoritos en cualquier momento.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grid de Productos Favoritos */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {favoriteProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-slate-200 text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            ¿Buscas más productos?
                        </h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Explora nuestro catálogo completo y encuentra exactamente lo que necesitas para tu proyecto.
                        </p>
                        <Button
                            onClick={() => navigate('/catalog')}
                            size="lg"
                            className="shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Ver Catálogo Completo
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FavoritesPage;
