
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/utils/logger';

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

    // Memoizar hora actual para evitar recalcular en cada render
    const currentTime = useMemo(() => format(new Date(), "HH:mm", { locale: es }), []);

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                Aprobaciones Pendientes
                            </h1>
                            <p className="text-slate-600 text-lg">
                                {requisitions?.length || 0} {requisitions?.length === 1 ? 'requisición' : 'requisiciones'} esperando tu revisión
                            </p>
                        </div>
                        {requisitions?.length > 0 && (
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                <span className="text-sm text-slate-600">Actualizado: {currentTime}</span>
                            </div>
                        )}
                    </div>
                </div>

                {requisitions?.length === 0 ? (
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-lg p-16">
                            <EmptyState
                                icon={<Check className="h-16 w-16 text-green-500" />}
                                title="¡Todo al día!"
                                description="No tienes requisiciones pendientes de aprobación en este momento."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto">
                        {/* Grid de Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {requisitions?.map((req) => (
                                <div
                                    key={req.id}
                                    className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
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
                                                className="flex-1 shadow-lg hover:shadow-xl"
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
                                                className="shadow-sm hover:shadow-md"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
