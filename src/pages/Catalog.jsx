
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';

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

  // Reset page cuando cambian los filtros
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setPage(1);
  };

  const hasActiveFilters = searchTerm || category !== 'all';

  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta name="description" content="Explore nuestro catálogo completo de productos." />
      </Helmet>

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header Simplificado - Sticky */}
          <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
            <div className="p-3 md:p-6 space-y-3 md:space-y-4">
              {/* Título - Solo visible en desktop */}
              <div className="hidden md:block">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                  Catálogo de Productos
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Encuentra todo lo que necesitas para tus proyectos
                </p>
              </div>

              {/* Barra de búsqueda - Prominente */}
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 md:pl-12 pr-10 h-11 md:h-12 rounded-xl bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-500 text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filtros en una fila */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Select de categoría */}
                <div className="flex-1 max-w-xs">
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="h-10 md:h-11 rounded-xl border-slate-300 bg-white">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <SelectValue placeholder="Categoría" />
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

                {/* Botón limpiar filtros - Solo si hay filtros activos */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10 md:h-11 px-3 md:px-4 rounded-xl border-slate-300 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Limpiar</span>
                  </Button>
                )}
              </div>

              {/* Contador de resultados */}
              {!isLoading && products.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">{totalCount}</span> productos
                    {debouncedSearchTerm && (
                      <span className="ml-1 text-slate-500">
                        · "{debouncedSearchTerm}"
                      </span>
                    )}
                    {category !== 'all' && (
                      <span className="ml-1 text-slate-500">
                        · {category}
                      </span>
                    )}
                  </p>
                  {isFetching && (
                    <span className="text-slate-500 text-xs">Actualizando...</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-6">
            {/* Loading State */}
            {isLoading && (
              <ProductCardSkeletonList count={pageSize} />
            )}

            {/* Error State */}
            {!isLoading && isError && (
              <div className="flex items-center justify-center min-h-[400px]">
                <ErrorState
                  error={isError}
                  onRetry={() => window.location.reload()}
                  showDetails={process.env.NODE_ENV === 'development'}
                />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && products.length === 0 && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 w-full max-w-2xl">
                  <EmptyState
                    title={searchTerm || category !== 'all' ? "No se encontraron productos" : "No hay productos disponibles"}
                    message={
                      searchTerm
                        ? `No encontramos resultados para "${searchTerm}". Intenta con otro término de búsqueda.`
                        : category !== 'all'
                        ? `No hay productos en la categoría "${category}". Prueba con otra categoría.`
                        : "Aún no hay productos en el catálogo. Los productos aparecerán aquí una vez que se agreguen."
                    }
                    icon="Search"
                  />
                </div>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && !isError && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
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
