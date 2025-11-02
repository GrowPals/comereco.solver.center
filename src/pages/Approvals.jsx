
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/useToast';
import { fetchPendingApprovals, updateRequisitionStatus } from '@/services/requisitionService';
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Approvals = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requisitionId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: requisitions, isLoading } = useQuery({
        queryKey: ['pendingApprovals'],
        queryFn: fetchPendingApprovals,
    });

    const mutation = useMutation({
        mutationFn: ({ requisitionId, status, reason }) => updateRequisitionStatus(requisitionId, status, reason),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['pendingApprovals']);
            queryClient.invalidateQueries(['requisitions']);
            toast({
                title: 'Éxito',
                description: `La requisición ha sido ${variables.status === 'approved' ? 'aprobada' : 'rechazada'}.`,
            });
            if (rejectionModal.isOpen) {
                handleCloseRejectionModal();
            }
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });

    const handleApprove = (requisitionId) => {
        mutation.mutate({ requisitionId, status: 'approved' });
    };

    const handleOpenRejectionModal = (requisitionId) => {
        setRejectionModal({ isOpen: true, requisitionId });
    };

    const handleCloseRejectionModal = () => {
        setRejectionModal({ isOpen: false, requisitionId: null });
        setRejectionReason('');
    };

    const handleReject = () => {
        if (!rejectionReason) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes proporcionar una razón para el rechazo.' });
            return;
        }
        mutation.mutate({
            requisitionId: rejectionModal.requisitionId,
            status: 'rejected',
            reason: rejectionReason,
        });
    };

    if (isLoading) {
        return <div className="p-8"><PageLoader /></div>;
    }

    return (
        <>
            <Helmet>
                <title>Aprobaciones Pendientes - ComerECO</title>
            </Helmet>
            <div className="p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Aprobaciones Pendientes</h1>
                </div>
                
                {requisitions?.length === 0 ? (
                    <EmptyState
                        icon={<Check className="h-16 w-16" />}
                        title="¡Todo al día!"
                        description="No tienes requisiciones pendientes de aprobación en este momento."
                    />
                ) : (
                    <div className="bg-card rounded-lg shadow-sm border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Folio</TableHead>
                                    <TableHead>Solicitante</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requisitions?.map((req) => (
                                    <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/requisitions/${req.id}`)}>
                                        <TableCell className="font-medium">{req.internal_folio}</TableCell>
                                        <TableCell>{req.creator?.full_name || 'N/A'}</TableCell>
                                        <TableCell>{format(new Date(req.created_at), "d MMM, yyyy", { locale: es })}</TableCell>
                                        <TableCell className="text-right">${req.total_amount.toLocaleString('es-MX')}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-500 hover:text-green-600 hover:bg-green-100"
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                                                    disabled={mutation.isPending}
                                                >
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-100"
                                                    onClick={(e) => { e.stopPropagation(); handleOpenRejectionModal(req.id); }}
                                                    disabled={mutation.isPending}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
            
            <Dialog open={rejectionModal.isOpen} onOpenChange={handleCloseRejectionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Requisición</DialogTitle>
                        <DialogDescription>
                            Por favor, proporciona una razón para el rechazo. Esta será visible para el solicitante.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Ej: Productos no disponibles, excede presupuesto..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleCloseRejectionModal}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject} isLoading={mutation.isPending}>
                            Rechazar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Approvals;
