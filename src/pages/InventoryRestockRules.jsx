import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, LineChart, Layers, ShieldCheck } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRestockRulesList } from '@/hooks/useRestockRules';
import { useProductCategories } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getAllProjects } from '@/services/projectService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { RestockRuleDesktopRow, RestockRuleMobileCard, EmptyRulesPlaceholder } from '@/components/inventory/RestockRuleRow';
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
  category: filters.category === 'all' ? undefined : filters.category,
  searchTerm
});

const FiltersBar = ({ filters, onFiltersChange, categories, projects, isRefreshing }) => {
  const handleUpdate = (key, value) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="search" className="text-xs font-semibold uppercase text-slate-500 tracking-[0.2em]">
            Buscar
          </label>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              id="search"
              type="search"
              placeholder="Nombre, SKU o notas"
              className="pl-10"
              value={filters.searchTerm}
              onChange={(event) => handleUpdate('searchTerm', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
            <Filter className="w-4 h-4" /> Estado
          </label>
          <Select value={filters.status} onValueChange={(value) => handleUpdate('status', value)}>
            <SelectTrigger className="mt-2">
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

        <div>
          <label className="text-xs font-semibold uppercase text-slate-500 tracking-[0.2em]">Proyecto</label>
          <Select value={filters.projectId} onValueChange={(value) => handleUpdate('projectId', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="general">Regla general</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-slate-500 tracking-[0.2em]">Categoría</label>
          <Select value={filters.category} onValueChange={(value) => handleUpdate('category', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category || 'sin-categoria'} value={category}>
                  {category || 'Sin categoría'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() =>
            onFiltersChange({ searchTerm: '', status: 'all', projectId: 'all', category: 'all', page: 1 })
          }
        >
          Limpiar filtros
        </Button>
        <Button variant="secondary" disabled={isRefreshing} onClick={() => onFiltersChange({ ...filters })}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

const SummaryTiles = ({ total, rules }) => {
  const activeCount = rules.filter((rule) => rule.status === 'active').length;
  const pausedCount = rules.filter((rule) => rule.status === 'paused').length;

  const tiles = [
    {
      title: 'Reglas registradas',
      value: total,
      description: 'Configuraciones vigentes en tu compañía.',
      icon: Layers,
      tone: 'from-blue-500/10 via-blue-500/5 to-transparent'
    },
    {
      title: 'Activas',
      value: activeCount,
      description: 'n8n evaluará estas reglas automáticamente.',
      icon: ShieldCheck,
      tone: 'from-emerald-500/10 via-emerald-500/5 to-transparent'
    },
    {
      title: 'Pausadas',
      value: pausedCount,
      description: 'Disponibles para revisión y ajustes manuales.',
      icon: LineChart,
      tone: 'from-amber-500/10 via-amber-500/5 to-transparent'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.title}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm"
        >
          <div className={cn('absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br', tile.tone)} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">{tile.title}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tile.value}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-inner">
              <tile.icon className="h-5 w-5 text-slate-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{tile.description}</p>
        </div>
      ))}
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

  const debouncedSearch = useDebounce(filters.searchTerm, 400);

  const queryFilters = useMemo(() => buildQueryFilters(filters, debouncedSearch), [filters, debouncedSearch]);

  const { data, isLoading, isFetching } = useRestockRulesList(queryFilters);
  const rules = data?.rules ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const { data: categoriesData = [] } = useProductCategories();
  const { data: projectsData = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'restock-panel'],
    queryFn: getAllProjects,
    staleTime: 1000 * 60 * 10
  });

  if (!canManageRestockRules) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">No tienes permisos para gestionar las reglas de reabastecimiento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white pb-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Reabastecimiento automático</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Visualiza y controla las reglas que disparan requisiciones cuando el stock llega al mínimo. Filtra por estado,
            proyecto o categoría y ajusta cada configuración sin salir de esta vista.
          </p>
        </section>

        <SummaryTiles total={total} rules={rules} />

        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          categories={categoriesData}
          projects={projectsData}
          isRefreshing={isFetching}
        />

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Stock mínimo</TableHead>
                  <TableHead>Solicitar</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock actual</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-14 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rules.length > 0 ? (
                  rules.map((rule) => (
                    <RestockRuleDesktopRow key={rule.id} rule={rule} projects={projectsData} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16">
                      <EmptyRulesPlaceholder />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden space-y-4 p-4">
            {isLoading ? (
              [...Array(3)].map((_, index) => <Skeleton key={index} className="h-48 w-full rounded-3xl" />)
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <RestockRuleMobileCard key={rule.id} rule={rule} projects={projectsData} />
              ))
            ) : (
              <EmptyRulesPlaceholder />
            )}
          </div>
        </section>

        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />

        {isLoadingProjects && (
          <p className="text-xs text-slate-500">Cargando proyectos disponibles...</p>
        )}
      </div>
    </div>
  );
};

export default InventoryRestockRules;

