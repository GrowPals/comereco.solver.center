
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { SectionIcon } from '@/components/ui/icon-wrapper';

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
            <PageContainer>
                <Helmet><title>{`Mis Favoritos - ComerECO`}</title></Helmet>
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header Skeleton */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-border">
                        <div className="flex items-center gap-4">
                                <Star className="page-title-icon-gold h-10 w-10" aria-hidden="true" />
                                <div>
                                    <h1 className="page-title mb-1">
                                        Mis <span className="page-title-accent-gold">Favoritos</span>
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" />
                                        <p className="text-base sm:text-lg text-muted-foreground">Cargando tus productos...</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 justify-items-start gap-3 sm:justify-items-center sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(10)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </PageContainer>
        );
    }

    // Estado de error
    if (isError) {
        return (
            <PageContainer className="flex items-center justify-center">
                <Helmet><title>{`Mis Favoritos - ComerECO`}</title></Helmet>
                <div className="max-w-md rounded-2xl border border-error/30 bg-card p-12 text-center">
                    <EmptyState
                        icon={AlertCircle}
                        title="Error al Cargar Favoritos"
                        description="No pudimos cargar tus productos favoritos. Por favor, inténtalo de nuevo."
                        actionButton={
                            <Button onClick={() => window.location.reload()} size="lg">
                                Reintentar
                            </Button>
                        }
                    />
                </div>
            </PageContainer>
        );
    }

    // Estado vacío - No hay favoritos
    if (favoriteCount === 0) {
        return (
            <PageContainer className="flex items-center justify-center">
                <Helmet><title>Mis Favoritos - ComerECO</title></Helmet>
                <div className="max-w-md rounded-2xl border border-border bg-card p-12 text-center">
                    <EmptyState
                        icon={<Star className="page-title-icon-gold" />}
                        title="Aún no tienes favoritos"
                        description="Explora el catálogo y marca los productos que más te gustan para encontrarlos aquí fácilmente."
                        actionButton={
                            <Button onClick={() => navigate('/catalog')} size="lg">
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                Explorar Catálogo
                            </Button>
                        }
                    />
                </div>
            </PageContainer>
        );
    }

    // Estado con productos favoritos
    return (
        <PageContainer>
            <Helmet>
                <title>Mis Favoritos - ComerECO</title>
            </Helmet>
            <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
                <header className="flex flex-col items-start gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <SectionIcon icon={Star} size="lg" className="text-amber-500 hidden sm:flex" />
                        <div>
                            <h1 className="text-3xl sm:text-2xl md:text-4xl font-bold tracking-tight text-foreground sm:mb-1">
                                Mis <span className="text-amber-500">Favoritos</span>
                            </h1>
                            <p className="text-base text-muted-foreground sm:text-sm max-w-2xl">
                                <span className="sm:hidden">Accede a tus productos guardados.</span>
                                <span className="hidden sm:inline">Tus productos guardados. Accede a ellos rápidamente y agrégalos a tus requisiciones.</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                        <Button
                            onClick={() => navigate('/catalog')}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Seguir Explorando
                        </Button>
                    </div>
                </header>

                    {/* Grid de Productos Favoritos */}
                    <div className="grid grid-cols-1 justify-items-start gap-3 pt-6 sm:justify-items-center sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {favoriteProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            ¿Buscas más productos?
                        </h3>
                        <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground sm:mb-6 sm:text-base">
                            Explora nuestro catálogo completo y encuentra exactamente lo que necesitas para tu proyecto.
                        </p>
                        <Button
                            onClick={() => navigate('/catalog')}
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Ver Catálogo Completo
                        </Button>
                    </div>
                </div>
            </PageContainer>
    );
};

export default FavoritesPage;
