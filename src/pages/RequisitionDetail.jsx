import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Check, X, Send, FileText, MessageSquare, FolderOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/useToast';
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
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageLoader from '@/components/PageLoader';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useRequisitionDetails } from '@/hooks/useRequisitions';
import { useRequisitionActions } from '@/hooks/useRequisitionActions';
import logger from '@/utils/logger';
import PageContainer from '@/components/layout/PageContainer';
import { SectionIcon } from '@/components/ui/icon-wrapper';


const RequisitionDetail = () => {
    const { id: requisitionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useSupabaseAuth();
    const { canApproveRequisitions } = useUserPermissions();
    
    const { data: requisition, isLoading, isError, refetch } = useRequisitionDetails(requisitionId);
    const { submit, isSubmitting, approve, isApproving, reject, isRejecting } = useRequisitionActions();

    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

    const handleNavigateBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleNavigateToRequisitions = useCallback(() => {
        navigate('/requisitions');
    }, [navigate]);

    useEffect(() => {
        if (isError) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la requisición.' });
            // Redirigir después de un breve delay para que el usuario vea el mensaje
            setTimeout(() => {
                navigate('/requisitions');
            }, 2000);
        }
    }, [isError, navigate, toast]);
    
    useEffect(() => {
        if (!requisitionId) return;
        
        const channel = supabase
            .channel(`requisition-detail:${requisitionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'requisitions',
                filter: `id=eq.${requisitionId}`
            }, (payload) => {
                toast({ title: "Requisición actualizada", description: "El estado de la requisición ha cambiado."});
                refetch();
            })
            .subscribe((status) => {
                if(status === 'SUBSCRIBED') {
                    logger.info(`Subscribed to requisition channel: ${requisitionId}`);
                }
            });
        
        return () => {
            supabase.removeChannel(channel).catch(err => logger.error("Error unsubscribing", err));
        };
    }, [requisitionId, toast, refetch]);

    const handleReject = useCallback(() => {
        if (!rejectionReason) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes proporcionar un motivo.' });
            return;
        }
        reject({ requisitionId, reason: rejectionReason });
    }, [rejectionReason, reject, requisitionId, toast]);

    const handleSubmit = useCallback(() => {
        submit(requisitionId);
    }, [submit, requisitionId]);

    const handleApproveConfirm = useCallback(() => {
        approve(requisitionId);
        setApprovalDialogOpen(false);
    }, [approve, requisitionId]);

    // CORREGIDO: Según documentación técnica oficial, el campo es created_by
    const isOwner = useMemo(() => user && requisition && user.id === requisition.created_by, [user, requisition]);
    const actionLoading = isSubmitting || isApproving || isRejecting;

    const projectIdRef = requisition?.project_id;

    const handleNavigateToProject = useCallback(() => {
        if (projectIdRef) {
            navigate(`/projects/${projectIdRef}`);
        }
    }, [navigate, projectIdRef]);

    // Memoizar formateo de fecha
    const formattedDate = useMemo(() => {
        if (!requisition?.created_at) return '';
        return format(new Date(requisition.created_at), 'dd MMM, yyyy', { locale: es });
    }, [requisition?.created_at]);

    if (isLoading) return <PageLoader />;
    if (isError || !requisition) {
        return (
            <div className="p-8 text-center">
                <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-bold mb-2">Requisición no encontrada</h2>
                    <p className="text-muted-foreground mb-4">La requisición que buscas no existe o no tienes permisos para verla.</p>
                    <Button onClick={handleNavigateToRequisitions}>
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                        Volver a Requisiciones
                    </Button>
                </div>
            </div>
        );
    }

    // CORREGIDO: Usar creator en lugar de requester según documentación
    const { internal_folio, created_at, business_status, creator, items, total_amount, comments, project } = requisition;

    const statusConfig = {
        draft: { text: 'Borrador', variant: 'draft', accent: 'bg-muted' },
        submitted: { text: 'Enviada', variant: 'sent', accent: 'bg-gradient-warning' },
        approved: { text: 'Aprobada', variant: 'approved', accent: 'bg-gradient-accent' },
        rejected: { text: 'Rechazada', variant: 'rejected', accent: 'bg-gradient-error' },
        ordered: { text: 'Ordenada', variant: 'ordered', accent: 'bg-gradient-info' },
        cancelled: { text: 'Cancelada', variant: 'muted', accent: 'bg-muted' },
    };

    const currentStatus = statusConfig[business_status] || { text: business_status, variant: 'muted', accent: 'bg-muted' };

    return (
        <>
            <Helmet><title>Detalle de Requisición {internal_folio} - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header with accent bar */}
                    <header className="relative rounded-2xl border-2 border-border bg-card p-6 shadow-soft-md overflow-hidden sm:p-8">
                        {/* Top accent bar based on status */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${currentStatus.accent}`} />

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-start gap-4 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleNavigateBack}
                                    aria-label="Volver"
                                    className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                >
                                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                                </Button>
                                <div className="flex-1">
                                    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                                        Requisición <span className="bg-gradient-primary bg-clip-text text-transparent">#{internal_folio}</span>
                                    </h1>
                                    <p className="text-base text-muted-foreground flex items-center gap-2">
                                        Creada por <span className="font-semibold text-foreground">{creator?.full_name || 'Desconocido'}</span> el {formattedDate}
                                    </p>
                                    {project && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <FolderOpen className="h-4 w-4 text-muted-foreground/80" />
                                            <span className="text-sm text-muted-foreground">Proyecto:</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={handleNavigateToProject}
                                                className="h-auto p-0 text-primary-600 hover:text-primary-700 font-semibold"
                                            >
                                                {project.name}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Badge variant={currentStatus.variant} className="text-sm px-4 py-2 shadow-sm">
                                {currentStatus.text}
                            </Badge>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Items Card */}
                            <Card className="shadow-md border-2">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <SectionIcon icon={FileText} />
                                        <CardTitle className="text-2xl font-bold text-foreground">Ítems de la Requisición</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Items List */}
                                    <div className="space-y-3">
                                        {items.map((item) => {
                                            const uniqueKey = item.id || `${item.product_id || 'unknown'}-${item.unit_price || '0'}-${item.quantity || '0'}`;
                                            return (
                                                <div
                                                    key={uniqueKey}
                                                    className="group relative bg-muted/80 rounded-xl p-4 border-2 border-border hover:border-primary-300 hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-lg text-foreground mb-1">
                                                                {item.product?.name || 'Producto no encontrado'}
                                                            </p>
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                SKU: <span className="font-mono rounded border border-border bg-muted/60 px-2 py-0.5">{item.product?.sku || 'N/A'}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right sm:min-w-[180px]">
                                                            <p className="text-base font-semibold text-foreground/90 mb-1">
                                                                {item.quantity} x ${(Number(item.unit_price) || 0).toFixed(2)}
                                                            </p>
                                                            <p className="text-xl font-bold text-foreground">
                                                                ${(Number(item.subtotal) || 0).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Total Section */}
                                    <Separator className="my-6" />
                                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-bold text-foreground">Total de Requisición</span>
                                            <span className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                                ${(Number(total_amount) || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Comments Card */}
                            {comments && (
                                <Card className="shadow-md border-2">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <SectionIcon icon={MessageSquare} />
                                            <CardTitle className="text-2xl font-bold text-foreground">Comentarios</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted/80 rounded-xl p-5 border-2 border-border">
                                            <p className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">{comments}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Actions Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-md border-2 sticky top-8">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl font-bold text-foreground">Acciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isOwner && business_status === 'draft' && (
                                        <Button
                                            className="w-full shadow-md hover:shadow-soft-md"
                                            size="lg"
                                            onClick={handleSubmit}
                                            disabled={actionLoading}
                                        >
                                            <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                                            Enviar para Aprobación
                                        </Button>
                                    )}
                                    {canApproveRequisitions && business_status === 'submitted' && (
                                        <>
                                            <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    className="w-full shadow-md hover:shadow-soft-md"
                                                                    variant="accent"
                                                                    size="lg"
                                                                    disabled={actionLoading}
                                                                >
                                                                    <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                                                                    Aprobar
                                                                </Button>
                                                            </DialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Aprobar requisición #{internal_folio}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                                                        <div className="rounded-xl bg-muted/80 p-4 border-2 border-border">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium text-muted-foreground">Folio</span>
                                                                <span className="text-lg font-bold text-foreground">#{internal_folio}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-muted-foreground">Monto Total</span>
                                                                <span className="text-2xl font-bold text-emerald-600">${(Number(total_amount) || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Esta acción aprobará la requisición y permitirá que se procese para su orden de compra.
                                                        </p>
                                                    </div>
                                                    <DialogFooter className="gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setApprovalDialogOpen(false)}
                                                            className="rounded-xl"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            variant="success"
                                                            onClick={handleApproveConfirm}
                                                            isLoading={isApproving}
                                                            className="rounded-xl"
                                                        >
                                                            <Check className="h-5 w-5 mr-2" />
                                                            Confirmar Aprobación
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    className="w-full shadow-md hover:shadow-soft-md"
                                                                    variant="destructive"
                                                                    size="lg"
                                                                    disabled={actionLoading}
                                                                >
                                                                    <X className="mr-2 h-5 w-5" aria-hidden="true" />
                                                                    Rechazar
                                                                </Button>
                                                            </DialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Rechazar requisición con motivo</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-bold">Rechazar Requisición</DialogTitle>
                                                        <DialogDescription className="text-base">
                                                            Por favor, especifica el motivo del rechazo para que el solicitante pueda corregir la requisición.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <Textarea
                                                        placeholder="Escribe el motivo del rechazo..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        aria-label="Motivo del rechazo"
                                                        className="min-h-[120px] resize-none"
                                                    />
                                                    <DialogFooter>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={handleReject}
                                                            disabled={!rejectionReason || actionLoading}
                                                            size="lg"
                                                            className="w-full shadow-md"
                                                        >
                                                            Confirmar Rechazo
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}
                                    {actionLoading && (
                                        <div className="flex items-center justify-center py-8">
                                            <PageLoader />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default RequisitionDetail;
