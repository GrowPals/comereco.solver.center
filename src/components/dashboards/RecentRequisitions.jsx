
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

const RecentRequisitions = () => {
    const navigate = useNavigate();
    const { data: requisitions, isLoading } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
    });

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
        <Card>
            <CardHeader>
                <CardTitle>Últimas Requisiciones</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead className="hidden sm:table-cell">Proyecto</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            requisitions?.map(req => (
                                <TableRow key={req.id} onClick={() => navigate(`/requisitions/${req.id}`)} className="cursor-pointer hover:bg-muted">
                                    <TableCell className="font-medium">{req.internal_folio}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{req.project?.name || 'N/A'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{format(parseISO(req.created_at), 'dd MMM yyyy', { locale: es })}</TableCell>
                                    <TableCell>${req.total_amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right"><Badge variant={getStatusVariant(req.business_status)}>{req.business_status}</Badge></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default RecentRequisitions;
