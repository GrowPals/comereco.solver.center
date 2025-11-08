
import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecentRequisitions } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { SectionIcon } from '@/components/ui/icon-wrapper';

// Funciones helper movidas fuera del componente para evitar recreación
const getStatusVariant = (status) => {
    switch (status) {
        case 'approved': return 'success';
        case 'rejected': return 'destructive';
        case 'submitted': return 'warning';
        case 'cancelled': return 'destructive';
        case 'draft': return 'secondary';
        case 'ordered': return 'default'; // Info/blue badge para "Ordenada"
        case 'processing': return 'default';
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
        case 'ordered': return 'Ordenada';
        case 'processing': return 'En proceso';
        default: return status;
    }
};

const RecentRequisitions = memo(() => {
    const navigate = useNavigate();
    const { data: requisitions, isLoading, isError } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
        staleTime: 1000 * 60 * 2, // 2 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Asegurar que requisitions sea un array
    const safeRequisitions = useMemo(
        () => (Array.isArray(requisitions) ? requisitions : []),
        [requisitions]
    );

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
                    <SectionIcon icon={Clock} />
                    <CardTitle className="text-xl font-bold text-foreground">Actividad Reciente</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {/* Mobile Card View */}
                <div className="space-y-3 px-4 md:hidden">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-28" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            </div>
                        ))
                    ) : safeRequisitions.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Clock className="h-12 w-12 text-muted-foreground/50" />
                            <p className="font-medium text-muted-foreground/80">
                                {isError ? 'No se pudieron cargar las requisiciones' : 'No hay requisiciones recientes'}
                            </p>
                        </div>
                    ) : (
                        safeRequisitions.map(req => (
                            <div
                                key={req.id}
                                onClick={() => handleRowClick(req.id)}
                                className="group cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Folio
                                            </span>
                                            <span className="font-bold text-foreground">{req.internal_folio}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Proyecto:</span>
                                            <span className="font-medium text-foreground">{req.project?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Fecha:</span>
                                            <span className="text-muted-foreground">
                                                {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="font-semibold text-foreground">
                                                ${formatPrice(req.total_amount)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={getStatusVariant(req.business_status)}
                                        className="shrink-0 font-semibold"
                                    >
                                        {getStatusLabel(req.business_status)}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border">
                                <TableHead className="font-bold text-foreground/90">Folio</TableHead>
                                <TableHead className="hidden sm:table-cell font-bold text-foreground/90">Proyecto</TableHead>
                                <TableHead className="hidden md:table-cell font-bold text-foreground/90">Fecha</TableHead>
                                <TableHead className="font-bold text-foreground/90">Total</TableHead>
                                <TableHead className="text-right font-bold text-foreground/90">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={`skeleton-${i}`} className="border-border/70">
                                        <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : safeRequisitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="h-12 w-12 text-muted-foreground/50" />
                                            <p className="font-medium">{isError ? 'No se pudieron cargar las requisiciones' : 'No hay requisiciones recientes'}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRequisitions.map(req => (
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
                </div>
            </CardContent>
        </Card>
    );
});

RecentRequisitions.displayName = 'RecentRequisitions';

export default RecentRequisitions;
