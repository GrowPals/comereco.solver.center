
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, X, FileText, Clock, User, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import PageContainer from '@/components/layout/PageContainer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/utils/logger';
import { cn } from '@/lib/utils';

const Approvals = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requisitionId: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [dismissingIds, setDismissingIds] = useState([]);

    const { data: requisitions, isLoading } = useQuery({
        queryKey: ['pendingApprovals'],
        queryFn: fetchPendingApprovals,
    });

    // Memoizar hora actual para evitar recalcular en cada render
    const currentTime = useMemo(() => format(new Date(), "HH:mm", { locale: es }), []);

    const startDismiss = (id) => {
        if (!id) return;
        setDismissingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const clearDismiss = (id) => {
        if (!id) return;
        setDismissingIds((prev) => prev.filter((value) => value !== id));
    };

    const mutation = useMutation({
        mutationFn: ({ requisitionId, status, reason }) => updateRequisitionStatus(requisitionId, status, reason),
        onSuccess: (data, variables) => {
            setTimeout(() => {
                queryClient.invalidateQueries(['pendingApprovals']);
                queryClient.invalidateQueries(['requisitions']);
                clearDismiss(variables.requisitionId);
            }, 220);
            toast({
                title: 'Éxito',
                description: `La requisición ha sido ${variables.status === 'approved' ? 'aprobada' : 'rechazada'}.`,
            });
            if (rejectionModal.isOpen) {
                handleCloseRejectionModal();
            }
        },
        onError: (error, variables) => {
            clearDismiss(variables?.requisitionId);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });

    const handleApprove = (requisitionId) => {
        startDismiss(requisitionId);
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
        startDismiss(rejectionModal.requisitionId);
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
            <PageContainer>
                {/* Header Section */}
                <div className="mx-auto mb-6 w-full max-w-7xl sm:mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                                Aprobaciones Pendientes
                            </h1>
                            <p className="text-sm text-slate-600 sm:text-base">
                                {requisitions?.length || 0} {requisitions?.length === 1 ? 'requisición' : 'requisiciones'} esperando tu revisión
                            </p>
                        </div>
                        {requisitions?.length > 0 && (
                            <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:w-auto">
                                <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                <span className="text-sm text-slate-600">Actualizado: {currentTime}</span>
                            </div>
                        )}
                    </div>
                </div>

                {requisitions?.length === 0 ? (
                    <div className="mx-auto w-full max-w-7xl">
                        <div className="bg-white rounded-2xl shadow-lg p-16">
                            <EmptyState
                                icon={<Check className="h-16 w-16 text-green-500" />}
                                title="¡Todo al día!"
                                description="No tienes requisiciones pendientes de aprobación en este momento."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-7xl">
                        {/* Grid de Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {requisitions?.map((req) => {
                                const isDismissing = dismissingIds.includes(req.id);
                                return (
                                <div
                                    key={req.id}
                                    className={cn(
                                        'group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                                        isDismissing && 'pointer-events-none opacity-0 translate-y-3 scale-[0.98]'
                                    )}
                                    style={isDismissing ? { maxHeight: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } : undefined}
                                    onClick={() => navigate(`/requisitions/${req.id}`)}
                                >
                                    {/* Accent Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                    <FileText className="h-6 w-6 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-500 mb-1">Folio</p>
                                                    <p className="text-xl font-bold text-slate-900">{req.internal_folio}</p>
                                                </div>
                                            </div>

                                            {/* Badge de Estado */}
                                            <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                                                <span className="text-xs font-semibold text-amber-700">Pendiente</span>
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Solicitante</p>
                                                    <p className="text-sm font-medium text-slate-700">{req.creator?.full_name || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Fecha</p>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {format(new Date(req.created_at), "d MMM, yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Monto */}
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <DollarSign className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-0.5">Monto Total</p>
                                                    <p className="text-2xl font-bold text-slate-900">
                                                        ${req.total_amount.toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApprove(req.id);
                                                }}
                                                disabled={mutation.isPending}
                                                variant="success"
                                                size="lg"
                                                className="flex-1 rounded-xl shadow-button hover:shadow-button-hover"
                                                isLoading={mutation.isPending}
                                            >
                                                <Check className="h-5 w-5" />
                                                <span>Aprobar</span>
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenRejectionModal(req.id);
                                                }}
                                                disabled={mutation.isPending}
                                                variant="destructive"
                                                size="icon"
                                                className="rounded-xl shadow-xs hover:shadow-sm"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    </div>
                )}
            </PageContainer>

            {/* Modal de Rechazo */}
            <Dialog open={rejectionModal.isOpen} onOpenChange={handleCloseRejectionModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Rechazar Requisición</DialogTitle>
                        <DialogDescription className="text-base">
                            Por favor, proporciona una razón para el rechazo. Esta será visible para el solicitante.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Ej: Productos no disponibles, excede presupuesto..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[120px] resize-none rounded-xl"
                        />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleCloseRejectionModal}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            isLoading={mutation.isPending}
                            className="rounded-xl bg-gradient-to-r from-red-500 to-red-600"
                        >
                            Rechazar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Approvals;
