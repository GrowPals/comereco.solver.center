
import React from 'react';
import { Helmet } from 'react-helmet';
import EmptyState from '@/components/EmptyState';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet><title>Historial de Requisiciones - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <EmptyState
                    icon={History}
                    title="Historial en Construcción"
                    description="Estamos desarrollando esta funcionalidad para que puedas consultar tu historial completo de requisiciones."
                    actionButton={
                        <Button onClick={() => navigate('/requisitions')} size="lg" className="shadow-lg hover:shadow-xl">
                            Ver Requisiciones Activas
                        </Button>
                    }
                />
            </div>
        </>
    );
};

export default HistoryPage;
