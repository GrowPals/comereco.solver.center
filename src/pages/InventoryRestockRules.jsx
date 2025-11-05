import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, RefreshCw } from 'lucide-react';
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
import { RestockRuleRow } from '@/components/inventory/RestockRuleRow';
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

const FiltersBar = ({
    filters,
    onFiltersChange,
    categories,
    projects,
    isRefreshing
}) => {
    const handleUpdate = (key, value) => {
        onFiltersChange({ ...filters, [key]: value, page: 1 });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 lg:p-5">
            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <label htmlFor="search" className="text-xs font-semibold uppercase text-slate-500">
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
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
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
                    <label className="text-xs font-semibold uppercase text-slate-500">Proyecto</label>
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
                    <label className="text-xs font-semibold uppercase text-slate-500">Categoría</label>
                    <Select value={filters.category} onValueChange={(value) => handleUpdate('category', value)}>
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category || 'Sin categoría'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                    variant="outline"
                    onClick={() => onFiltersChange({ searchTerm: '', status: 'all', projectId: 'all', category: 'all', page: 1 })}
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

const SummaryPills = ({ total, rules }) => {
    const activeCount = rules.filter((rule) => rule.status === 'active').length;
    const pausedCount = rules.filter((rule) => rule.status === 'paused').length;

    return (
        <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="px-4 py-2 rounded-full text-sm font-medium">
                Total de reglas: <span className="ml-2 font-semibold text-slate-900">{total}</span>
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium">
                Activas en vista: <span className="ml-2 font-semibold">{activeCount}</span>
            </Badge>
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-medium">
                Pausadas en vista: <span className="ml-2 font-semibold">{pausedCount}</span>
            </Badge>
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
        <div className="min-h-screen bg-slate-50 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Reabastecimiento automático</h1>
                    <p className="text-sm text-slate-600">
                        Administra las reglas que n8n usará para generar requisiciones cuando el stock llegue al mínimo.
                    </p>
                </header>

                <SummaryPills total={total} rules={rules} />

                <FiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={categoriesData}
                    projects={projectsData}
                    isRefreshing={isFetching}
                />

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="hidden lg:block overflow-x-auto">
                        <Table>
                            <TableHeader>
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
                                        <RestockRuleRow key={rule.id} rule={rule} projects={projectsData} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                                            No se encontraron reglas con los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="lg:hidden space-y-4 p-4">
                        {isLoading ? (
                            [...Array(3)].map((_, index) => <Skeleton key={index} className="h-40 w-full rounded-2xl" />)
                        ) : rules.length > 0 ? (
                            rules.map((rule) => (
                                <RestockRuleRow key={rule.id} rule={rule} projects={projectsData} />
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center">
                                No se encontraron reglas con los filtros seleccionados.
                            </p>
                        )}
                    </div>
                </div>

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
