import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, Layers, ShieldCheck, PauseCircle, Plus } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useDebounce } from '@/hooks/useDebounce';
import { useRestockRuleMutations, useRestockRulesList } from '@/hooks/useRestockRules';
import { useProductCategories } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getAllProjects } from '@/services/projectService';
import { quickSearchProducts } from '@/services/productService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import Pagination from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { RestockRuleCard, EmptyRulesPlaceholder } from '@/components/inventory/RestockRuleCard';
import { cn } from '@/lib/utils';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/useToast';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { formatNumber } from '@/lib/formatters';
import { SectionIcon } from '@/components/ui/icon-wrapper';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' }
];

const PAGE_SIZE = 10;

const buildQueryFilters = (filters, searchTerm) => ({
  page: filters.page,
  pageSize: PAGE_SIZE,
  status: filters.status === 'all' ? undefined : filters.status,
  projectId: filters.projectId === 'all' ? undefined : (filters.projectId === 'general' ? null : filters.projectId),
  category:
    filters.category === 'all'
      ? undefined
      : filters.category === '__null__'
        ? null
        : filters.category,
  searchTerm
});

const SummaryStat = ({ icon: Icon, title, value }) => (
  <div className="surface-card flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
    <div className="flex items-center gap-3">
      <IconWrapper icon={Icon} variant="neutral" size="lg" />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 sm:text-[11px]">{title}</p>
        <p className="text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

const FiltersBar = ({ filters, onFiltersChange, categories, projects, isRefreshing }) => {
  const handleUpdate = (key, value) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handleClear = () => {
    onFiltersChange({ searchTerm: '', status: 'all', projectId: 'all', category: 'all', page: 1 });
  };

  const categoryOptions = Array.isArray(categories) ? categories : [];
  const projectOptions = Array.isArray(projects) ? projects : [];

  return (
    <div className="surface-panel rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,2.2fr)_repeat(3,minmax(190px,1fr))] xl:gap-4">
        <div className="flex flex-col justify-end">
          <label
            htmlFor="restock-search"
            className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80"
          >
            Buscar
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="restock-search"
              type="search"
              placeholder="Nombre, SKU o notas"
              value={filters.searchTerm}
              onChange={(event) => handleUpdate('searchTerm', event.target.value)}
              className="h-11 rounded-2xl border-2 border-border pl-12 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 dark:border-border dark:text-foreground"
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
            <Filter className="h-4 w-4" /> Estado
          </label>
          <Select value={filters.status} onValueChange={(value) => handleUpdate('status', value)}>
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-2 border-border text-sm font-medium text-foreground dark:border-border dark:text-foreground">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">Proyecto</label>
          <Select value={filters.projectId} onValueChange={(value) => handleUpdate('projectId', value)}>
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-2 border-border text-sm font-medium text-foreground dark:border-border dark:text-foreground">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="general">Regla general</SelectItem>
              {projectOptions.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">Categoría</label>
          <Select value={filters.category} onValueChange={(value) => handleUpdate('category', value)}>
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-2 border-border text-sm font-medium text-foreground dark:border-border dark:text-foreground">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categoryOptions.map((category) => {
                const optionValue = category ?? '__null__';
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {category ?? 'Sin categoría'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          onClick={handleClear}
          className="h-10 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:border-primary-300 hover:text-foreground dark:border-border"
        >
          Reiniciar filtros
        </Button>
        <Button
          variant="secondary"
          disabled={isRefreshing}
          onClick={() => onFiltersChange({ ...filters })}
          className="h-10 rounded-2xl px-5 text-sm font-semibold"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

const CreateRuleDialog = ({ open, onOpenChange, projects }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const {
    data: productSearchPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingProducts,
    isPending: isInitialLoad
  } = useInfiniteQuery({
    queryKey: ['restock-rule-product-search', debouncedSearch],
    queryFn: ({ pageParam = 1 }) => quickSearchProducts({ searchTerm: debouncedSearch, page: pageParam, pageSize: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length + 1 : undefined),
    enabled: open,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60
  });

  const productOptions = productSearchPages?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
    }
  }, [open]);

  const { saveRule, isSaving } = useRestockRuleMutations({ productId: selectedProduct?.id, projectId: null });

  const handleSubmit = async (values) => {
    if (!selectedProduct) {
      toast({
        title: 'Selecciona un producto',
        description: 'Elige un producto antes de guardar la regla.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await saveRule({
        productId: selectedProduct.id,
        projectId: values.projectId,
        minStock: values.minStock,
        reorderQuantity: values.reorderQuantity,
        status: values.status,
        notes: values.notes,
        preferredVendor: values.preferredVendor,
        preferredWarehouse: values.preferredWarehouse
      });
      toast({
        title: 'Regla creada',
        description: `${selectedProduct.name ?? 'El producto'} ahora tiene automatización de reabastecimiento.`,
        variant: 'success'
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'No se pudo crear la regla',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const renderProductList = () => {
    if (!open) return null;

    if ((isInitialLoad || (isFetchingProducts && productOptions.length === 0))) {
      return (
        <div className="space-y-2 p-2">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      );
    }

    if (productOptions.length === 0) {
      return (
        <div className="flex h-[240px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {debouncedSearch
            ? 'No se encontraron productos para la búsqueda.'
            : 'Comienza escribiendo para filtrar o desplázate por la lista inicial.'}
        </div>
      );
    }

    return (
      <div className="flex flex-col" role="list">
        {productOptions.map((product) => {
          const isSelected = selectedProduct?.id === product.id;
          return (
            <button
              type="button"
              key={product.id}
              role="listitem"
              className={cn(
                'flex flex-col gap-1 border-b border-border/60 px-4 py-3 text-left transition-all last:border-b-0 hover:bg-muted',
                isSelected && 'bg-primary/10 shadow-inner'
              )}
              onClick={() => setSelectedProduct(product)}
            >
              <p className="text-sm font-semibold text-foreground">{product.name || 'Producto sin nombre'}</p>
              <p className="text-xs text-muted-foreground">
                SKU {product.sku || 'N/D'} · Stock {formatNumber(product.stock ?? 0)}
              </p>
            </button>
          );
        })}

        {hasNextPage && (
          <div className="border-t border-border/80 p-3">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl text-sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más resultados'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="pb-2">
          <DialogTitle>Crear regla de reabastecimiento</DialogTitle>
          <DialogDescription>Selecciona un producto y define los parámetros para automatizar su reabastecimiento.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">Producto</label>
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Nombre o SKU"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 rounded-2xl border-2 border-border pl-12 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                />
              </div>
              {selectedProduct && (
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-border/80 bg-card px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {selectedProduct.name || 'Producto sin nombre'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Limpiar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 rounded-3xl border border-border/70 bg-card/80 shadow-sm">
              <ScrollArea className="max-h-[65vh] min-h-[320px]">
                {renderProductList()}
              </ScrollArea>
            </div>
          </div>

          <div className="space-y-4">
            {selectedProduct ? (
              <>
                <div className="rounded-3xl border border-border/80 bg-muted/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">Configurando</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedProduct.name || 'Producto sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">SKU {selectedProduct.sku || 'N/D'}</p>
                  <p className="text-sm text-muted-foreground">Stock actual: {formatNumber(selectedProduct.stock ?? 0)} u</p>
                </div>

                <RestockRuleForm
                  key={selectedProduct.id}
                  rule={null}
                  projects={projects}
                  onSubmit={handleSubmit}
                  onCancel={() => onOpenChange(false)}
                  isSubmitting={isSaving}
                  layout="horizontal"
                />
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/30 px-6 py-8 text-center text-sm text-muted-foreground">
                Selecciona un producto de la lista para comenzar a configurar su regla automática.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InventoryRestockRules = () => {
  const { canManageRestockRules } = useUserPermissions();
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    projectId: 'all',
    category: 'all',
    page: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.searchTerm, 400);
  const queryFilters = useMemo(() => buildQueryFilters(filters, debouncedSearch), [filters, debouncedSearch]);

  const { data, isLoading, isFetching } = useRestockRulesList(queryFilters);
  const rules = data?.rules ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const activeCount = rules.filter((rule) => rule.status === 'active').length;
  const pausedCount = rules.filter((rule) => rule.status === 'paused').length;

  const { data: categoriesData = [] } = useProductCategories();
  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects', 'restock-panel'],
    queryFn: getAllProjects,
    staleTime: 1000 * 60 * 10
  });

  const categoryOptions = Array.isArray(categoriesData)
    ? Array.from(new Set(categoriesData))
    : [];
  const projectOptions = Array.isArray(projectsData) ? projectsData : [];

  if (!canManageRestockRules) {
    return (
      <PageContainer>
        <div className="mx-auto flex h-[60vh] w-full max-w-3xl items-center justify-center rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">Sin acceso a Reabastecimiento</h1>
            <p className="text-sm text-muted-foreground">
              Esta vista está disponible para supervisores y administradores. Solicita a tu administrador acceso para
              configurar reglas automáticas.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Helmet>
        <title>Reabastecimiento Automático - ComerECO</title>
        <meta name="description" content="Configura las reglas de stock mínimo para automatizar requisiciones." />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col items-start gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-6">
            <div className="flex items-center gap-4 sm:gap-5">
                <SectionIcon icon={Layers} size="lg" className="hidden sm:flex" />
                <div>
                    <h1 className="text-3xl sm:text-2xl md:text-4xl font-bold tracking-tight text-foreground sm:mb-1">
                        Reabastecimiento <span className="bg-gradient-primary bg-clip-text text-transparent">Automático</span>
                    </h1>
                    <p className="text-base text-muted-foreground sm:text-sm max-w-2xl">
                        <span className="sm:hidden">Configura reglas de stock mínimo.</span>
                        <span className="hidden sm:inline">Configura reglas para disparar requisiciones cuando el stock llegue a un mínimo.</span>
                    </p>
                </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-4 w-4" /> 
                    Crear regla
                </Button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SummaryStat
            icon={Layers}
            title="Reglas registradas"
            value={total}
          />
          <SummaryStat
            icon={ShieldCheck}
            title="Activas"
            value={activeCount}
          />
          <SummaryStat
            icon={PauseCircle}
            title="Pausadas"
            value={pausedCount}
          />
        </div>

        <section className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full rounded-2xl text-sm font-semibold sm:hidden"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>

          <div className={cn('sm:block', showFilters ? 'block' : 'hidden sm:block')}>
            <FiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              categories={categoryOptions}
              projects={projectOptions}
              isRefreshing={isFetching}
            />
          </div>
        </section>

        <section className="surface-panel px-4 py-4 sm:px-5">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : rules.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {rules.map((rule) => (
                <RestockRuleCard key={rule.id} rule={rule} projects={projectOptions} />
              ))}
            </div>
          ) : (
            <EmptyRulesPlaceholder />
          )}
        </section>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>

      <CreateRuleDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} projects={projectOptions} />
    </PageContainer>
  );
};

export default InventoryRestockRules;
