
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, X, FileText, Clock, User, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/useToast';
import { fetchPendingApprovals, updateRequisitionStatus } from '@/services/requisitionService';
import PageLoader from '@/components/PageLoader';
import PageContainer from '@/components/layout/PageContainer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/utils/logger';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { IconWrapper, SectionIcon } from '@/components/ui/icon-wrapper';

const Approvals = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requisitionId: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalModal, setApprovalModal] = useState({ isOpen: false, requisitionId: null, folio: '', amount: 0 });
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

    const handleOpenApprovalModal = (requisitionId, folio, amount) => {
        setApprovalModal({ isOpen: true, requisitionId, folio, amount });
    };

    const handleCloseApprovalModal = () => {
        setApprovalModal({ isOpen: false, requisitionId: null, folio: '', amount: 0 });
    };

    const handleApprove = () => {
        const requisitionId = approvalModal.requisitionId;
        startDismiss(requisitionId);
        mutation.mutate({ requisitionId, status: 'approved' });
        handleCloseApprovalModal();
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
        <PageContainer>
            <Helmet>
                <title>Aprobaciones Pendientes - ComerECO</title>
            </Helmet>
            <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
                <header className="flex flex-col items-start gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <SectionIcon icon={CheckCircle} size="lg" className="hidden sm:flex" />
                        <div>
                            <h1 className="text-3xl sm:text-2xl md:text-4xl font-bold tracking-tight text-foreground sm:mb-1">
                                Aprobaciones <span className="bg-gradient-primary bg-clip-text text-transparent">Pendientes</span>
                            </h1>
                            <p className="text-base text-muted-foreground sm:text-sm max-w-2xl">
                                <span className="sm:hidden">Revisa y gestiona aprobaciones.</span>
                                <span className="hidden sm:inline">Revisa, aprueba o rechaza las requisiciones que requieren tu atención.</span>
                            </p>
                        </div>
                    </div>
                    {requisitions?.length > 0 && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-sm dark:border-border dark:bg-card">
                                    <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    <span className="text-sm text-muted-foreground">Actualizado: {currentTime}</span>
                                </div>
                            </div>
                        )}
                    </header>
                </div>

                <div className="mx-auto w-full max-w-7xl mt-6 sm:mt-8">
                    {requisitions?.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card shadow-soft-md dark:border-border dark:bg-card">
                            <div className="flex flex-col items-center justify-center min-h-[360px] md:min-h-[480px] max-w-md mx-auto px-6 text-center">
                                {/* Icon with consistent circular background */}
                                <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-neutral-800 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 stroke-[1.5]" />
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                    No hay aprobaciones pendientes
                                </h3>

                                {/* Description */}
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    Cuando haya requisiciones esperando tu aprobación, aparecerán aquí para que puedas revisarlas
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto w-full max-w-7xl">
                            {/* Grid de Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {requisitions?.map((req) => {
                                    const isDismissing = dismissingIds.includes(req.id);
                                    return (
                                    <div
                                        key={req.id}
                                        className={cn(
                                            'group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-border bg-card shadow-soft-md transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg dark:border-border dark:bg-card',
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
                                                    <SectionIcon icon={FileText} />
                                                    <div>
                                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Folio</p>
                                                        <p className="text-xl font-bold text-foreground">{req.internal_folio}</p>
                                                    </div>
                                                </div>

                                                {/* Badge de Estado */}
                                                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-400/60 dark:bg-amber-500/15">
                                                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-200">Pendiente</span>
                                                </div>
                                            </div>

                                            {/* Info Grid */}
                                            <div className="mb-5 grid grid-cols-2 gap-4 border-b border-border/70 pb-5 dark:border-border">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Solicitante</p>
                                                        <p className="text-sm font-medium text-foreground">{req.creator?.full_name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Fecha</p>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {format(new Date(req.created_at), "d MMM, yyyy", { locale: es })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Monto */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    <IconWrapper icon={DollarSign} variant="neutral" size="md" className="text-emerald-600 dark:text-emerald-200" />
                                                    <div>
                                                        <p className="mb-0.5 text-xs text-muted-foreground">Monto Total</p>
                                                        <p className="text-2xl font-bold text-foreground">
                                                            ${formatNumber(req.total_amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenApprovalModal(req.id, req.internal_folio, req.total_amount);
                                                                }}
                                                                disabled={mutation.isPending}
                                                                variant="success"
                                                                size="lg"
                                                                className="flex-1 rounded-xl shadow-button hover:shadow-button-hover"
                                                            >
                                                                <Check className="h-5 w-5" />
                                                                <span>Aprobar</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Aprobar requisición #{req.internal_folio}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
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
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Rechazar requisición</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Modal de Aprobación */}
                <Dialog open={approvalModal.isOpen} onOpenChange={handleCloseApprovalModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                Confirmar Aprobación
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                ¿Estás seguro de que deseas aprobar esta requisición?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-3">
                            <div className="rounded-xl bg-muted/80 p-4 border-2 border-border shadow-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Folio</span>
                                    <span className="text-lg font-bold text-foreground">#{approvalModal.folio}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">Monto Total</span>
                                    <span className="text-2xl font-bold text-emerald-600">${formatNumber(approvalModal.amount)}</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Esta acción aprobará la requisición y permitirá que se procese para su orden de compra.
                            </p>
                        </div>
                        <DialogFooter className="gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleCloseApprovalModal}
                                className="rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleApprove}
                                isLoading={mutation.isPending}
                                className="rounded-xl"
                            >
                                <Check className="h-5 w-5 mr-2" />
                                Confirmar Aprobación
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
            </PageContainer>
    );
};

export default Approvals;
