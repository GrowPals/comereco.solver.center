
import React from 'react';
import { Helmet } from 'react-helmet';
import EmptyState from '@/components/EmptyState';
import { BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet><title>Reportes - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <EmptyState
                    icon={BarChart2}
                    title="Módulo de Reportes en Construcción"
                    description="Estamos trabajando para traerte análisis y visualizaciones poderosas. ¡Vuelve pronto!"
                    actionButton={
                        <Button onClick={() => navigate('/dashboard')} size="lg" className="shadow-lg hover:shadow-xl">
                            Volver al Dashboard
                        </Button>
                    }
                />
            </div>
        </>
    );
};

export default ReportsPage;
