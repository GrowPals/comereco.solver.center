
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
import PageContainer from '@/components/layout/PageContainer';
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
                <PageContainer>
                    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                        {/* Header Skeleton */}
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="icon-badge favorite-icon-badge flex h-14 w-14 items-center justify-center">
                                    <Star className="favorite-icon h-7 w-7" aria-hidden="true" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">
                                        Mis <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Favoritos</span>
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" />
                                        <p className="text-base sm:text-lg text-muted-foreground">Cargando tus productos...</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 justify-items-start gap-4 sm:justify-items-center md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(10)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </>
        );
    }

    // Estado de error
    if (isError) {
        return (
            <>
                <Helmet><title>{`Mis Favoritos - ComerECO`}</title></Helmet>
                <PageContainer className="flex items-center justify-center">
                    <div className="bg-card rounded-2xl shadow-lg p-12 max-w-md border-2 border-error/30">
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
                </PageContainer>
            </>
        );
    }

    // Estado vacío - No hay favoritos
    if (favoriteCount === 0) {
        return (
            <>
                <Helmet><title>Mis Favoritos - ComerECO</title></Helmet>
                <PageContainer className="flex items-center justify-center">
                    <div className="bg-card rounded-2xl shadow-lg p-12 max-w-md border-2 border-border">
                        <EmptyState
                            icon={<Star className="favorite-icon" />}
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
                </PageContainer>
            </>
        );
    }

    // Estado con productos favoritos
    return (
        <>
            <Helmet><title>{`Mis Favoritos (${favoriteCount}) - ComerECO`}</title></Helmet>
            <PageContainer className="pb-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="icon-badge favorite-icon-badge flex h-14 w-14 items-center justify-center">
                                <Star className="favorite-icon h-7 w-7" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">
                                    Mis <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Favoritos</span>
                                </h1>
                                <p className="text-base sm:text-lg text-muted-foreground">
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
                    <div className="favorite-spotlight hidden rounded-2xl p-6 md:block">
                        <div className="flex items-start gap-4">
                            <div className="icon-badge favorite-icon-badge flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                <Star className="favorite-icon h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-1">Tus productos favoritos</h3>
                                <p className="text-sm text-muted-foreground">
                                    Estos son los productos que has marcado como favoritos. Puedes agregarlos rápidamente a tu carrito o quitarlos de favoritos en cualquier momento.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grid de Productos Favoritos */}
                    <div className="grid grid-cols-1 justify-items-start gap-4 sm:justify-items-center md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {favoriteProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-md sm:p-8">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            ¿Buscas más productos?
                        </h3>
                        <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground sm:mb-6 sm:text-base">
                            Explora nuestro catálogo completo y encuentra exactamente lo que necesitas para tu proyecto.
                        </p>
                        <Button
                            onClick={() => navigate('/catalog')}
                            size="lg"
                            className="shadow-lg hover:shadow-xl bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800"
                        >
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Ver Catálogo Completo
                        </Button>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default FavoritesPage;
