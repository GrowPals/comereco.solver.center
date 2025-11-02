
import React, { useState, useMemo } from 'react';
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
  const pageSize = 12;

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


  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta name="description" content="Explore nuestro catálogo completo de productos." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-10 pb-8 border-b border-slate-200">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
              Catálogo de Productos
            </h1>
            <p className="text-base sm:text-lg text-slate-600">
              Encuentra todo lo que necesitas para tus proyectos
            </p>
          </header>

          {/* Filters Bar */}
          <div className="sticky top-20 z-10 mb-8 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-md">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-12 rounded-xl bg-slate-50 border-slate-200"
                />
                {isFetching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-blue-500" />
                )}
              </div>

              {/* Category Filter */}
              <div className="flex gap-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full lg:w-[220px] h-12 rounded-xl border-slate-200">
                    <Filter className="h-4 w-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {isLoadingCategories ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">Cargando...</div>
                    ) : (
                      categories?.map(cat => cat ? <SelectItem key={cat} value={cat}>{cat}</SelectItem> : null)
                    )}
                  </SelectContent>
                </Select>
                {category && category !== 'all' && (
                  <Button variant="ghost" size="icon" onClick={() => setCategory('all')} className="h-12 w-12 rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-10 w-10 rounded-lg ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-10 w-10 rounded-lg ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            {!isLoading && products.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-900">{totalCount}</span> productos encontrados
                </p>
                {debouncedSearchTerm && (
                  <p className="text-slate-500">
                    Resultados para: <span className="font-medium text-slate-700">"{debouncedSearchTerm}"</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Content */}
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
              <div className="bg-white rounded-2xl shadow-lg p-16 w-full max-w-2xl">
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
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12">
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
    </>
  );
};

export default CatalogPage;
