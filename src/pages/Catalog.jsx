
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Filter, X, Loader2 } from 'lucide-react';

import { useProducts, useProductCategories } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import EmptyState from '@/components/EmptyState';

const CatalogPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filters = useMemo(() => ({
    searchTerm: debouncedSearchTerm,
    category,
    page,
    pageSize,
  }), [debouncedSearchTerm, category, page, pageSize]);

  const { data: productsData, isLoading, isError, isFetching } = useProducts(filters);
  const { data: categories, isLoading: isLoadingCategories } = useProductCategories();

  const products = productsData?.data ?? [];
  const totalCount = productsData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const renderSkeletons = () => (
    Array.from({ length: pageSize }).map((_, index) => (
      <div key={index} className="flex flex-col space-y-3">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))
  );

  return (
    <>
      <Helmet>
        <title>Catálogo de Productos - ComerECO</title>
        <meta name="description" content="Explore nuestro catálogo completo de productos." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Catálogo de Productos</h1>
            <p className="mt-2 text-muted-foreground">Encuentra todo lo que necesitas para tus proyectos.</p>
          </header>

          <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10">
            <div className="relative flex-grow">
              <Input
                placeholder="Buscar por nombre de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>Cargando...</SelectItem>
                  ) : (
                    categories?.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
              {category && (
                <Button variant="ghost" size="icon" onClick={() => setCategory('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {renderSkeletons()}
            </div>
          )}

          {!isLoading && isError && (
            <EmptyState
              title="Error al cargar productos"
              message="Hubo un problema al conectar con el servidor. Por favor, intenta de nuevo más tarde."
              icon="AlertTriangle"
            />
          )}

          {!isLoading && !isError && products.length === 0 && (
            <EmptyState
              title="No se encontraron productos"
              message="Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas."
              icon="Search"
            />
          )}

          {!isLoading && !isError && products.length > 0 && (
            <>
              <motion.div
                layout
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}
              >
                {products.map(product => (
                  <motion.div layout key={product.id}>
                    <ProductCard product={product} viewMode={viewMode} />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-8"
                />
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default CatalogPage;
