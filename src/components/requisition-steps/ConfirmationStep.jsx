
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ConfirmationStep = ({ requisitionId, onStartNew, onViewRequisition }) => {
    const navigate = useNavigate();
    
    return (
        <div className="text-center p-8">
            <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
            <h2 className="text-3xl font-bold">¡Requisición Enviada!</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Tu requisición con folio <span className="font-bold text-primary">{requisitionId}</span> ha sido creada exitosamente.
            </p>

             <Card className="mt-8 text-left max-w-sm mx-auto">
                <CardHeader>
                    <CardTitle>Próximos Pasos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>Recibirás una notificación cuando tu requisición sea aprobada o rechazada.</p>
                </CardContent>
            </Card>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                 <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    <Home className="w-4 h-4 mr-2" /> Ir al inicio
                </Button>
                <Button onClick={onViewRequisition}>
                    <Eye className="w-4 h-4 mr-2" /> Ver Requisición
                </Button>
            </div>
        </div>
    );
};

export default ConfirmationStep;
