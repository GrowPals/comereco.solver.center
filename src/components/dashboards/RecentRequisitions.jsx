
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecentRequisitions } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollShadow } from '@/components/ui/scroll-shadow';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Funciones helper movidas fuera del componente para evitar recreación
const getStatusVariant = (status) => {
    switch (status) {
        case 'approved': return 'success';
        case 'rejected': return 'destructive';
        case 'submitted': return 'warning';
        case 'cancelled': return 'destructive';
        case 'draft': return 'secondary';
        default: return 'default';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'approved': return 'Aprobada';
        case 'rejected': return 'Rechazada';
        case 'submitted': return 'Enviada';
        case 'cancelled': return 'Cancelada';
        case 'draft': return 'Borrador';
        default: return status;
    }
};

const RecentRequisitions = memo(() => {
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const { data: requisitions, isLoading, isError } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
        staleTime: 1000 * 60 * 2, // 2 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Asegurar que requisitions sea un array y ordenar
    const safeRequisitions = useMemo(
        () => (Array.isArray(requisitions) ? requisitions : []),
        [requisitions]
    );

    // Función para ordenar requisiciones
    const sortedRequisitions = useMemo(() => {
        if (!safeRequisitions.length) return [];

        const sorted = [...safeRequisitions];
        const { key, direction } = sortConfig;

        sorted.sort((a, b) => {
            let aValue, bValue;

            switch (key) {
                case 'internal_folio':
                    aValue = a.internal_folio || '';
                    bValue = b.internal_folio || '';
                    return direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);

                case 'created_at':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    return direction === 'asc' ? aValue - bValue : bValue - aValue;

                case 'total_amount':
                    aValue = Number(a.total_amount) || 0;
                    bValue = Number(b.total_amount) || 0;
                    return direction === 'asc' ? aValue - bValue : bValue - aValue;

                case 'business_status':
                    aValue = getStatusLabel(a.business_status);
                    bValue = getStatusLabel(b.business_status);
                    return direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);

                case 'project':
                    aValue = a.project?.name || '';
                    bValue = b.project?.name || '';
                    return direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);

                default:
                    return 0;
            }
        });

        return sorted;
    }, [safeRequisitions, sortConfig]);

    // Función para cambiar ordenación
    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    // Componente para icono de ordenación
    const SortIcon = useCallback(({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
        ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
        );
    }, [sortConfig]);

    const handleRowClick = useCallback(
        (reqId) => {
            navigate(`/requisitions/${reqId}`);
        },
        [navigate]
    );

    return (
        <Card className="dashboard-panel surface-panel">
            <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                    <div className="metric-icon flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
                        <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">Actividad Reciente</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <ScrollShadow className="rounded-lg border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border">
                                <TableHead
                                    className="font-bold text-foreground/90 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort('internal_folio')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSort('internal_folio')}
                                    aria-label="Ordenar por folio"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Folio</span>
                                        <SortIcon columnKey="internal_folio" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="hidden sm:table-cell font-bold text-foreground/90 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort('project')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSort('project')}
                                    aria-label="Ordenar por proyecto"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Proyecto</span>
                                        <SortIcon columnKey="project" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="hidden md:table-cell font-bold text-foreground/90 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort('created_at')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSort('created_at')}
                                    aria-label="Ordenar por fecha"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Fecha</span>
                                        <SortIcon columnKey="created_at" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-bold text-foreground/90 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort('total_amount')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSort('total_amount')}
                                    aria-label="Ordenar por monto total"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Total</span>
                                        <SortIcon columnKey="total_amount" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-right font-bold text-foreground/90 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort('business_status')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSort('business_status')}
                                    aria-label="Ordenar por estado"
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Estado</span>
                                        <SortIcon columnKey="business_status" />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-border/70">
                                        <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sortedRequisitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="h-12 w-12 text-muted-foreground/50" />
                                            <p className="font-medium">{isError ? 'No se pudieron cargar las requisiciones' : 'No hay requisiciones recientes'}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedRequisitions.map(req => (
                                    <TableRow
                                        key={req.id}
                                        onClick={() => handleRowClick(req.id)}
                                        className="cursor-pointer hover:bg-muted/70 transition-colors border-border/70"
                                    >
                                        <TableCell className="font-bold text-foreground">{req.internal_folio}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{req.project?.name || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                            ${formatPrice(req.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={getStatusVariant(req.business_status)}
                                                className="font-semibold"
                                            >
                                                {getStatusLabel(req.business_status)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollShadow>
            </CardContent>
        </Card>
    );
});

RecentRequisitions.displayName = 'RecentRequisitions';

export default RecentRequisitions;
