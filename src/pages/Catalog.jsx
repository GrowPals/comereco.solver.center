
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      pageSize,
    }),
    [debouncedSearchTerm, category, pageSize]
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
  }, [filtersKey.searchTerm, filtersKey.category]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategory('all');
  }, []);

  const hasActiveFilters = Boolean(debouncedSearchTerm) || category !== 'all';

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

      <div className={cn('min-h-screen bg-slate-50', isDesktop ? 'pb-14' : 'pb-28')}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn(isDesktop ? 'pt-10' : 'pt-24')}>
            {isDesktop ? (
              <div className="sticky top-16 z-30 grid grid-cols-[1.6fr,2fr,1.2fr] items-end gap-10 rounded-3xl border border-slate-200 bg-white/95 px-10 py-8 shadow-sm backdrop-blur">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-slate-900">Catálogo de productos</h1>
                  <p className="text-sm text-slate-600">
                    Encuentra proveedores y materiales clave en segundos. Filtra, compara y agrega sin fricción.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Buscar productos por nombre o SKU"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-12 text-base focus:border-blue-500 focus:bg-white"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">{totalCount}</span> productos disponibles
                      {debouncedSearchTerm && (
                        <span className="ml-2 text-slate-500">“{debouncedSearchTerm}”</span>
                      )}
                      {category !== 'all' && (
                        <span className="ml-2 text-slate-500">· {category}</span>
                      )}
                    </p>
                    {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-left font-medium">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filtrar por categoría" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Todos los productos</SelectItem>
                      {isLoadingCategories ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Cargando…</div>
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

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-10 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-6">
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-900">Catálogo</h1>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-semibold uppercase tracking-wide text-blue-600"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Escoge productos y actualiza cantidades sin perder tu posición.
                  </p>
                  <div className="mt-4">
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-left text-sm font-medium">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Todas las categorías" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {isLoadingCategories ? (
                          <div className="px-3 py-2 text-sm text-slate-500">Cargando…</div>
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
                </div>

                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  <span>
                    <span className="text-base font-semibold text-slate-900">{totalCount}</span> productos
                  </span>
                  {isFetching && <span className="text-[11px] text-slate-400">Actualizando…</span>}
                </div>
              </div>
            )}

            <section>
              {showInitialLoading && <ProductCardSkeletonList count={pageSize} />}

              {isError && !showInitialLoading && (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white/80 p-8">
                  <ErrorState
                    error={error}
                    onRetry={() => refetch()}
                    showDetails={process.env.NODE_ENV === 'development'}
                  />
                </div>
              )}

              {showEmptyState && (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="w-full max-w-xl rounded-3xl border border-dashed border-slate-200 bg-white/95 p-10 text-center shadow-sm">
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
                  <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  <div ref={loadMoreRef} className="h-8 w-full" aria-hidden="true" />

                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
                    </div>
                  )}

                  {!hasNextPage && products.length > 0 && (
                    <p className="py-10 text-center text-sm font-medium text-slate-500">
                      Has llegado al final del catálogo.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogPage;
