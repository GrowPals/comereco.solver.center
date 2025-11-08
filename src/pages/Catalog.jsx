
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Filter, X, Loader2 } from 'lucide-react';

import { fetchProducts } from '@/services/productService';
import { useProductCategories } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

import ProductCard from '@/components/ProductCard';
import { ProductCardSkeletonList } from '@/components/skeletons/ProductCardSkeleton';
import ErrorState from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageContainer from '@/components/layout/PageContainer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import EmptyState from '@/components/EmptyState';

const MOBILE_BREAKPOINT = 1024;

const computePageSize = (width) => {
  if (!Number.isFinite(width)) return 24;
  if (width >= 1760) return 72;
  if (width >= 1600) return 64;
  if (width >= 1440) return 56;
  if (width >= 1280) return 48;
  if (width >= 1024) return 36;
  if (width >= 768) return 28;
  return 24;
};

const CatalogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  );

  const isDesktop = viewportWidth >= MOBILE_BREAKPOINT;
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const pageSize = useMemo(() => computePageSize(viewportWidth), [viewportWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filtersKey = useMemo(
    () => ({
      searchTerm: debouncedSearchTerm,
      category: category === 'all' ? '' : category,
      availability: includeOutOfStock ? 'all' : 'in_stock',
      pageSize,
    }),
    [debouncedSearchTerm, category, includeOutOfStock, pageSize]
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['catalog-products', filtersKey],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      fetchProducts({
        pageParam,
        searchTerm: filtersKey.searchTerm,
        category: filtersKey.category,
        availability: filtersKey.availability,
        pageSize: filtersKey.pageSize,
      }),
    getNextPageParam: (lastPage) =>
      typeof lastPage?.nextPage === 'number' ? lastPage.nextPage : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const products = useMemo(
    () => data?.pages?.flatMap((page) => page?.products ?? []) ?? [],
    [data]
  );

  const totalCount = data?.pages?.[0]?.totalCount ?? 0;

  const { data: categories, isLoading: isLoadingCategories } = useProductCategories();

  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '480px 0px 320px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filtersKey.searchTerm, filtersKey.category, filtersKey.availability]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleAvailabilityChange = (checked) => {
    setIncludeOutOfStock(Boolean(checked));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategory('all');
    setIncludeOutOfStock(false);
  }, []);

  const hasActiveFilters = Boolean(debouncedSearchTerm) || category !== 'all' || includeOutOfStock;

  const showInitialLoading = isLoading && products.length === 0;
  const showEmptyState = !showInitialLoading && !isError && products.length === 0;

  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta
          name="description"
          content="Explora y agrega productos a tus requisiciones de forma ágil en ComerECO."
        />
      </Helmet>

      <ScrollToTopButton />

      <PageContainer className={cn(isDesktop ? 'pb-16' : 'pb-28')}>
        <div className="mx-auto w-full max-w-7xl">
          <div className={cn(isDesktop ? 'pt-6' : 'pt-2')}>
            {isDesktop ? (
              <div className="surface-panel space-y-6 px-8 py-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="max-w-3xl space-y-2">
                    <h1 className="text-3xl font-semibold text-foreground">Catálogo de productos</h1>
                    <p className="text-sm text-muted-foreground">
                      Encuentra proveedores y materiales clave en segundos. Filtra, compara y agrega sin fricción.
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground lg:text-right">
                    <p>
                      <span className="font-semibold text-foreground">{totalCount}</span> productos disponibles
                      {debouncedSearchTerm && (
                        <span className="ml-2 text-muted-foreground">&ldquo;{debouncedSearchTerm}&rdquo;</span>
                      )}
                      {category !== 'all' && (
                        <span className="ml-2 text-muted-foreground">· {category}</span>
                      )}
                      {includeOutOfStock && (
                        <span className="ml-2 text-muted-foreground">· Incluye sin stock</span>
                      )}
                    </p>
                    {isFetching && <span className="text-xs text-muted-foreground">Actualizando…</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[320px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70 transition-colors dark:text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Buscar por nombre o SKU"
                      className="h-12 w-full rounded-2xl border border-border/80 bg-[var(--surface-contrast)] pl-12 pr-12 text-base shadow-sm transition-all focus:border-primary-500 focus:bg-[var(--surface-contrast)] focus:shadow-[var(--focus-glow)] dark:border-border dark:bg-muted/70 dark:shadow-none dark:focus:bg-card"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:hover:text-foreground"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-shrink-0 min-w-[220px]">
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-12 w-full rounded-2xl border border-border/80 bg-[var(--surface-contrast)] text-left font-medium shadow-sm transition-colors hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/50 dark:border-border dark:bg-card dark:shadow-none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Filtrar por categoría" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {isLoadingCategories ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground/80">Cargando…</div>
                        ) : (
                          categories?.map((cat) =>
                            cat ? (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ) : null
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Label
                    htmlFor="availability-toggle-desktop"
                    className="flex h-12 flex-shrink-0 min-w-[220px] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white/95 px-4 text-sm shadow-sm transition-colors hover:bg-white dark:border-border dark:bg-card dark:hover:bg-card/80"
                  >
                    <span className="text-sm font-medium text-foreground">Incluir productos sin stock</span>
                    <Switch
                      id="availability-toggle-desktop"
                      checked={includeOutOfStock}
                      onCheckedChange={handleAvailabilityChange}
                      aria-label="Incluir productos sin stock"
                    />
                  </Label>

                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={clearFilters}
                      title="Limpiar filtros"
                      className="h-12 w-12 flex-shrink-0 rounded-2xl border border-border/70 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Limpiar filtros</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-5">
                <div className="surface-panel px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-foreground">Catálogo</h1>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-semibold uppercase tracking-wide text-primary-600"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground/80">
                    Escoge productos y actualiza cantidades sin perder tu posición.
                  </p>
                  <div className="mt-3">
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-11 w-full rounded-xl border border-border/80 bg-[var(--surface-contrast)] text-left text-sm font-medium shadow-sm transition-colors hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/50 dark:border-border dark:bg-muted/70 dark:shadow-none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Todas las categorías" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {isLoadingCategories ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground/80">Cargando…</div>
                        ) : (
                          categories?.map((cat) =>
                            cat ? (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ) : null
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Label
                    htmlFor="availability-toggle-mobile"
                    className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/80 bg-[var(--surface-overlay-strong)] px-4 py-3 shadow-sm transition-colors hover:bg-[var(--surface-overlay)] active:scale-[0.98] dark:border-border/70 dark:bg-[var(--surface-overlay)] dark:hover:bg-[var(--surface-overlay-strong)]"
                  >
                    <span className="text-sm font-medium text-foreground">
                      Incluir productos sin stock
                    </span>
                    <Switch
                      id="availability-toggle-mobile"
                      checked={includeOutOfStock}
                      onCheckedChange={handleAvailabilityChange}
                      aria-label="Incluir productos sin stock"
                    />
                  </Label>
                </div>

                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span>
                    <span className="text-base font-semibold text-foreground">{totalCount}</span> productos
                    {includeOutOfStock && <span className="ml-1 text-muted-foreground">· Incluye sin stock</span>}
                  </span>
                  {isFetching && <span className="text-[11px] text-muted-foreground">Actualizando…</span>}
                </div>
              </div>
            )}

            <section className="mt-6 lg:mt-8">
              {showInitialLoading && <ProductCardSkeletonList count={pageSize} />}

              {isError && !showInitialLoading && (
                <div className="flex min-h-[360px] items-center justify-center surface-card p-8">
                  <ErrorState
                    error={error}
                    onRetry={() => refetch()}
                    showDetails={import.meta.env.DEV}
                  />
                </div>
              )}

              {showEmptyState && (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="w-full max-w-xl surface-card border border-dashed border-border p-10 text-center">
                    <EmptyState
                      title={hasActiveFilters ? 'No se encontraron resultados' : 'Aún no hay productos disponibles'}
                      message={
                        hasActiveFilters
                          ? 'Ajusta tu búsqueda o prueba con otra categoría para continuar explorando.'
                          : 'Cuando se añadan productos al catálogo, los verás aquí.'
                      }
                      icon="Search"
                    />
                  </div>
                </div>
              )}

              {!showInitialLoading && !showEmptyState && !isError && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  <div ref={loadMoreRef} className="h-8 w-full" aria-hidden="true" />

                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/70" aria-hidden="true" />
                    </div>
                  )}

                  {!hasNextPage && products.length > 0 && (
                    <p className="py-10 text-center text-sm font-medium text-muted-foreground/80">
                      Has llegado al final del catálogo.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default CatalogPage;
