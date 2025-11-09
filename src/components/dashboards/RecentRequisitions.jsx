
import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecentRequisitions } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import es from 'date-fns/locale/es';
import { Clock } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { SectionIcon } from '@/components/ui/icon-wrapper';
import { cn } from '@/lib/utils';

const statusAccentClass = {
    approved: 'bg-emerald-400',
    rejected: 'bg-red-400',
    submitted: 'bg-amber-400',
    pending: 'bg-amber-400',
    ordered: 'bg-blue-400',
    draft: 'bg-slate-400',
    processing: 'bg-cyan-400',
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
                            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
                        safeRequisitions.map(req => {
                            const accent = statusAccentClass[req.business_status] || 'bg-primary-400';
                            return (
                                <div
                                    key={req.id}
                                    onClick={() => handleRowClick(req.id)}
                                    className="group relative cursor-pointer rounded-2xl border border-border bg-card p-4 pl-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg active:scale-[0.98]"
                                >
                                    <span className={cn('absolute inset-y-4 left-2 w-1 rounded-full', accent)} aria-hidden="true" />
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Folio
                                                </span>
                                                <span className="font-bold text-foreground text-base">{req.internal_folio}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Proyecto</p>
                                                    <p className="font-medium text-foreground line-clamp-2 leading-tight">
                                                        {req.project?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fecha</p>
                                                    <p className="text-muted-foreground font-medium">
                                                        {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                                                    <p className="font-semibold text-foreground">
                                                        ${formatPrice(req.total_amount)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Estado</p>
                                                    <p className="font-semibold text-foreground">
                                                        {req.business_status?.toUpperCase() || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge status={req.business_status} className="shrink-0 font-semibold text-xs leading-tight" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto md:block">
                    <div className="mx-4 rounded-3xl border border-border/70 bg-card shadow-sm">
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
                                    <TableRow key={i} className="border-border/70">
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
                                safeRequisitions.map(req => {
                                    const accent = statusAccentClass[req.business_status] || 'bg-primary-300';
                                    return (
                                        <TableRow
                                            key={req.id}
                                            onClick={() => handleRowClick(req.id)}
                                            className="group cursor-pointer border-border/70 transition-colors hover:bg-muted/60"
                                        >
                                            <TableCell className="font-semibold text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn('h-2 w-2 rounded-full', accent)} aria-hidden="true" />
                                                    {req.internal_folio}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground">{req.project?.name || 'N/A'}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                ${formatPrice(req.total_amount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge status={req.business_status} className="font-semibold" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

RecentRequisitions.displayName = 'RecentRequisitions';

export default RecentRequisitions;
