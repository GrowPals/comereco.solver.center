import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, Layers, ShieldCheck, PauseCircle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useDebounce } from '@/hooks/useDebounce';
import { useRestockRulesList } from '@/hooks/useRestockRules';
import { useProductCategories } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getAllProjects } from '@/services/projectService';
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
  <div className="surface-card flex items-center justify-between rounded-2xl px-5 py-4">
    <div className="flex items-center gap-3">
      <span className="icon-badge flex h-11 w-11 items-center justify-center">
        <Icon className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,2.2fr)_repeat(3,minmax(190px,1fr))] xl:gap-4">
        <div className="flex flex-col justify-end">
          <label
            htmlFor="restock-search"
            className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80"
          >
            Buscar
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 dark:text-primary-100/70" />
            <Input
              id="restock-search"
              type="search"
              placeholder="Nombre, SKU o notas"
              value={filters.searchTerm}
              onChange={(event) => handleUpdate('searchTerm', event.target.value)}
              className="h-11 rounded-2xl border border-border bg-white/80 pl-12 text-sm font-medium text-foreground/90 placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/20 dark:border-[rgba(120,190,255,0.28)] dark:bg-[rgba(16,32,60,0.72)] dark:text-primary-50 dark:placeholder:text-primary-200/60"
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
            <Filter className="h-4 w-4" /> Estado
          </label>
          <Select value={filters.status} onValueChange={(value) => handleUpdate('status', value)}>
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-border bg-white/80 text-sm font-medium text-foreground/90 dark:border-[rgba(120,190,255,0.28)] dark:bg-[rgba(16,32,60,0.72)] dark:text-primary-50">
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
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-border bg-white/80 text-sm font-medium text-foreground/90 dark:border-[rgba(120,190,255,0.28)] dark:bg-[rgba(16,32,60,0.72)] dark:text-primary-50">
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
            <SelectTrigger className="mt-2 h-11 rounded-2xl border-border bg-white/80 text-sm font-medium text-foreground/90 dark:border-[rgba(120,190,255,0.28)] dark:bg-[rgba(16,32,60,0.72)] dark:text-primary-50">
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="ghost"
          onClick={handleClear}
          className="h-10 rounded-2xl border border-transparent text-sm font-semibold text-muted-foreground hover:border-border hover:text-foreground dark:border-[rgba(120,190,255,0.28)] dark:text-primary-100"
        >
          Limpiar filtros
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
        <title>Reglas de Reabastecimiento - ComerECO</title>
        <meta name="description" content="Configura las reglas de stock mínimo para automatizar requisiciones." />
      </Helmet>

      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 lg:gap-7">
        <section className="surface-panel px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[2.05rem]">Reabastecimiento automático</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Configura reglas para disparar requisiciones cuando el stock llegue a un mínimo.
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden h-11 rounded-2xl px-6 text-sm font-semibold lg:inline-flex"
              onClick={() => setFilters({ searchTerm: '', status: 'all', projectId: 'all', category: 'all', page: 1 })}
            >
              Reiniciar filtros
            </Button>
          </div>
        </section>

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
    </PageContainer>
  );
};

export default InventoryRestockRules;
