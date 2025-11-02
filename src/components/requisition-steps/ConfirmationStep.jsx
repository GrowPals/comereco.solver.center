import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequisitions } from '@/hooks/useRequisitions';

const ConfirmationStep = ({ requisitionId }) => {
    const navigate = useNavigate();
    const { requisitions } = useRequisitions();
    const requisition = requisitions.find(r => r.id === requisitionId);

    return (
        <div className="text-center p-8">
            <CheckCircle className="mx-auto h-20 w-20 text-secondary mb-6" />
            <h2 className="text-3xl font-bold">¡Requisición Enviada!</h2>
            <p className="text-neutral-70 mt-2 max-w-md mx-auto">
                Tu requisición <span className="font-bold text-primary">{requisitionId}</span> ha sido creada exitosamente y enviada para su aprobación.
            </p>

            {requisition && (
                 <Card className="mt-8 text-left max-w-sm mx-auto">
                    <CardHeader>
                        <CardTitle>{requisition.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-70">ID:</span>
                            <span className="font-mono">{requisition.id}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-neutral-70">Total:</span>
                            <span className="font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(requisition.total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-70">Estado:</span>
                             <span className="font-semibold text-warning">Pendiente</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                 <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    <Home className="w-4 h-4 mr-2" /> Volver al Dashboard
                </Button>
                <Button variant="secondary" onClick={() => navigate('/requisitions/new', { replace: true })}>
                    <Plus className="w-4 h-4 mr-2" /> Crear Otra Requisición
                </Button>
            </div>
        </div>
    );
};

export default ConfirmationStep;