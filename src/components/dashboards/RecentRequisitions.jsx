
import React from 'react';
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

const RecentRequisitions = () => {
    const navigate = useNavigate();
    const { data: requisitions, isLoading, isError } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
        retry: false, // No reintentar si falla
        refetchOnWindowFocus: false, // No reintentar al enfocar ventana
    });

    // Asegurar que requisitions sea un array
    const safeRequisitions = Array.isArray(requisitions) ? requisitions : [];

    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'destructive';
            case 'submitted': return 'warning';
            case 'draft': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <Clock className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Actividad Reciente</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-200">
                                <TableHead className="font-bold text-slate-700">Folio</TableHead>
                                <TableHead className="hidden sm:table-cell font-bold text-slate-700">Proyecto</TableHead>
                                <TableHead className="hidden md:table-cell font-bold text-slate-700">Fecha</TableHead>
                                <TableHead className="font-bold text-slate-700">Total</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-100">
                                        <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : safeRequisitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-500 py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="h-12 w-12 text-slate-300" />
                                            <p className="font-medium">{isError ? 'No se pudieron cargar las requisiciones' : 'No hay requisiciones recientes'}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRequisitions.map(req => (
                                    <TableRow
                                        key={req.id}
                                        onClick={() => navigate(`/requisitions/${req.id}`)}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-100"
                                    >
                                        <TableCell className="font-bold text-slate-900">{req.internal_folio}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-slate-600">{req.project?.name || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-600">
                                            {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            ${req.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={getStatusVariant(req.business_status)}
                                                className="font-semibold capitalize"
                                            >
                                                {req.business_status}
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
};

export default RecentRequisitions;
