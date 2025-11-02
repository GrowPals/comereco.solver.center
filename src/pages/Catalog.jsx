
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Filter, X, Loader2 } from 'lucide-react';

import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';

const CatalogPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const {
    products,
    categories,
    loading,
    error,
    pagination,
    filters,
    updateFilter,
    setPage,
  } = useProducts();

  const debouncedSearch = useDebounce((value) => {
    updateFilter('searchTerm', value);
  }, 500);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const renderSkeletons = () => (
    Array.from({ length: pagination.limit }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))
  );

  const FiltersSidebar = () => (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-full w-72 bg-card border-r z-50 p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Filtros</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsFiltersOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium">Categoría</label>
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'Todas' : cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Ordenar por</label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="price">Precio</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Dirección</label>
          <Select value={filters.sortAsc ? 'asc' : 'desc'} onValueChange={(value) => updateFilter('sortAsc', value === 'asc')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascendente</SelectItem>
              <SelectItem value="desc">Descendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta name="description" content="Explora nuestro catálogo completo de productos." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
            <p className="text-muted-foreground">Explora, busca y encuentra lo que necesitas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsFiltersOpen(true)} className="lg:hidden">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="hidden lg:flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Filtros en Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat === 'all' ? 'Todas' : cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Ordenar por</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="price">Precio</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Select value={filters.sortAsc ? 'asc' : 'desc'} onValueChange={(value) => updateFilter('sortAsc', value === 'asc')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                className="w-full"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {error && <EmptyState title="Error" message={error} />}
            
            {!error && (
              <>
                <motion.div
                  layout
                  className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}
                >
                  {loading ? renderSkeletons() : products.map(product => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </motion.div>

                {!loading && products.length === 0 && (
                  <EmptyState
                    title="No se encontraron productos"
                    message="Intenta ajustar tus filtros de búsqueda o revisa más tarde."
                  />
                )}

                {!loading && products.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, pagination.page - 1)); }} disabled={pagination.page === 1} />
                        </PaginationItem>
                        {[...Array(totalPages).keys()].map(p => (
                          <PaginationItem key={p}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(p + 1); }} isActive={pagination.page === p + 1}>
                              {p + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, pagination.page + 1)); }} disabled={pagination.page === totalPages} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsFiltersOpen(false)}
            />
            <FiltersSidebar />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CatalogPage;
