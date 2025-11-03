
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { LayoutGrid, List, Filter, X, Loader2 } from 'lucide-react';

import { useProducts, useProductCategories } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

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
import { Pagination } from '@/components/ui/pagination';
import EmptyState from '@/components/EmptyState';

const CatalogPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const pageSize = 12;
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filters = useMemo(() => ({
    searchTerm: debouncedSearchTerm,
    category: category === 'all' ? '' : category,
    page,
    pageSize,
  }), [debouncedSearchTerm, category, page, pageSize]);

  const { data: productsData, isLoading, isError, isFetching } = useProducts(filters);
  const { data: categories, isLoading: isLoadingCategories } = useProductCategories();

  const products = productsData?.data ?? [];
  const totalCount = productsData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Scroll inteligente para ocultar/mostrar header en mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Solo aplicar en mobile
      if (window.innerWidth >= 768) {
        setIsHeaderVisible(true);
        return;
      }

      if (currentScrollY < 50) {
        // Cerca del top, siempre mostrar
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling hacia arriba
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling hacia abajo y no estamos cerca del top
        setIsHeaderVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta name="description" content="Explore nuestro catálogo completo de productos." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Header - Sticky con filtros integrados y scroll inteligente */}
          <div
            ref={headerRef}
            className={`sticky z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300 ${
              isHeaderVisible ? 'top-0 translate-y-0' : '-translate-y-full md:translate-y-0 md:top-0'
            }`}
          >
            <div className="p-4 sm:p-6">
              {/* Título - Solo visible en desktop o cuando el header está expandido */}
              <div className={`mb-4 transition-all duration-300 ${isHeaderVisible ? 'block' : 'hidden md:block'}`}>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1">
                  Catálogo de Productos
                </h1>
                <p className="hidden sm:block text-sm text-slate-600">
                  Encuentra todo lo que necesitas para tus proyectos
                </p>
              </div>

              {/* Filters Bar - Optimizado para mobile */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 sm:p-4">
                {/* Buscador y filtro en una sola fila en mobile */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  {/* Search y Category en la misma fila en mobile */}
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 h-11 rounded-xl bg-white border-slate-300 focus:border-primary-500"
                      />
                      {isFetching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary-500" />
                      )}
                    </div>

                    {/* Category Filter - Más compacto en mobile */}
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-[140px] sm:w-[200px] h-11 rounded-xl border-slate-300">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <SelectValue placeholder="Filtro" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {isLoadingCategories ? (
                          <div className="px-2 py-1.5 text-sm text-slate-500">Cargando...</div>
                        ) : (
                          categories?.map(cat => cat ? <SelectItem key={cat} value={cat}>{cat}</SelectItem> : null)
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear filter button - Solo mostrar cuando hay filtro activo */}
                  {category && category !== 'all' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCategory('all')}
                      className="h-11 w-11 rounded-xl flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  {/* View Mode Toggle - Solo en desktop */}
                  <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className={`h-9 w-9 rounded-lg ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                      aria-label="Vista en cuadrícula"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className={`h-9 w-9 rounded-lg ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                      aria-label="Vista en lista"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Results count - Más compacto */}
                {!isLoading && products.length > 0 && (
                  <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm">
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-900">{totalCount}</span> productos
                      {debouncedSearchTerm && (
                        <span className="ml-1 text-slate-500">
                          para "{debouncedSearchTerm}"
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {isLoading && <ProductCardSkeletonList count={pageSize} />}

            {!isLoading && isError && (
              <div className="flex items-center justify-center min-h-[400px]">
                <ErrorState
                  error={isError}
                  onRetry={() => window.location.reload()}
                  showDetails={process.env.NODE_ENV === 'development'}
                />
              </div>
            )}

            {!isLoading && !isError && products.length === 0 && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 w-full max-w-2xl">
                  <EmptyState
                    title="No se encontraron productos"
                    message="Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas."
                    icon="Search"
                  />
                </div>
              </div>
            )}

            {!isLoading && !isError && products.length > 0 && (
              <>
                <div className={`grid gap-3 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-12">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogPage;
