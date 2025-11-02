
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useRequisitions } from '@/hooks/useRequisitions';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Check, X, ThumbsUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast.js';
import { motion, AnimatePresence } from 'framer-motion';
import RequisitionCard from '@/components/RequisitionCard'; // Reutilizamos el card
import logger from '@/utils/logger';


const ApprovalsPage = () => {
    const { user } = useSupabaseAuth(); 
    const { requisitions, loading, updateStatus } = useRequisitions();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionState, setActionState] = useState({}); // { [id]: 'approving' | 'rejecting' }

    const pendingRequisitions = useMemo(() => {
        if (!user) return [];
        // Filtramos por el nuevo 'business_status'
        return requisitions
            .filter(req => req.business_status === 'submitted')
            .filter(req => 
                (req.internal_folio && req.internal_folio.toLowerCase().includes(searchTerm.toLowerCase())) || 
                (req.requester?.full_name && req.requester.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [requisitions, user, searchTerm]);

    const handleUpdateStatus = async (id, newStatus, reason = null) => {
        const action = newStatus === 'approved' ? 'approving' : 'rejecting';
        setActionState(prev => ({...prev, [id]: action}));
        
        try {
            await updateStatus(id, newStatus);
            toast({
                title: `Requisición ${newStatus === 'approved' ? 'Aprobada' : 'Rechazada'}`,
                description: `El folio #${id.substring(0,8)}... ha cambiado de estado.`,
            });
        } catch(err) {
            logger.error(`Failed to ${newStatus} requisition ${id}`, err);
            toast({
                title: 'Error en la operación',
                description: err.message || 'No se pudo actualizar el estado.',
                variant: 'destructive',
            });
        } finally {
            setActionState(prev => {
                const newState = {...prev};
                delete newState[id];
                return newState;
            });
        }
    };
    
    return (
        <>
            <Helmet><title>Bandeja de Aprobaciones - ComerECO</title></Helmet>
            <div className="p-6 lg:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">Bandeja de Aprobaciones</h1>
                        <p className="text-muted-foreground mt-1">Tienes {pendingRequisitions.length} requisiciones pendientes de revisión.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por folio o solicitante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 rounded-xl text-base pl-12"
                    />
                </div>

                <AnimatePresence>
                    {loading && pendingRequisitions.length === 0 ? (
                         <div className="text-center p-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
                    ) : pendingRequisitions.length > 0 ? (
                        <motion.div className="space-y-6" layout>
                            {pendingRequisitions.map(req => (
                                <motion.div key={req.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                    <Card className="overflow-hidden">
                                        <div className="relative group">
                                            <RequisitionCard requisition={req} />
                                            <div className="absolute top-0 right-0 bottom-0 flex items-center justify-end p-4 bg-gradient-to-l from-card via-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="flex items-center gap-2">
                                                     <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" disabled={!!actionState[req.id]} aria-label="Rechazar">
                                                                <X className="w-5 h-5"/>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Rechazar Requisición {req.internal_folio}</DialogTitle>
                                                                <DialogDescription>Por favor, escribe el motivo del rechazo. El usuario será notificado.</DialogDescription>
                                                            </DialogHeader>
                                                            <form onSubmit={(e) => {
                                                                e.preventDefault();
                                                                const reason = e.target.elements.reason.value;
                                                                if(reason) {
                                                                    handleUpdateStatus(req.id, 'rejected', reason);
                                                                    const closeButton = e.target.closest('.relative').querySelector('button[aria-label="Close"]');
                                                                    if(closeButton) closeButton.click();
                                                                }
                                                            }}>
                                                                <Textarea id="reason" placeholder="Ej: Ítem duplicado, excede presupuesto..." required className="my-4"/>
                                                                <DialogFooter>
                                                                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                                                                    <Button type="submit" variant="destructive" disabled={actionState[req.id] === 'rejecting'}>
                                                                        {actionState[req.id] === 'rejecting' ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirmar Rechazo'}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                     </Dialog>
                                                     <Button variant="primary" size="icon" onClick={() => handleUpdateStatus(req.id, 'approved')} disabled={!!actionState[req.id]} aria-label="Aprobar">
                                                        {actionState[req.id] === 'approving' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-5 h-5"/>}
                                                     </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Card className="text-center py-20">
                                <CardContent>
                                    <ThumbsUp className="mx-auto h-16 w-16 text-primary" />
                                    <h3 className="mt-6 text-xl font-bold">¡Todo en orden!</h3>
                                    <p className="mt-2 text-base text-muted-foreground">No tienes requisiciones pendientes por aprobar. Buen trabajo.</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default ApprovalsPage;
