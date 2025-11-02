
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { FileText, Hourglass, CheckCircle, XCircle, ShoppingCart, LayoutTemplate, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UserDashboard = ({ user }) => {
    const navigate = useNavigate();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
    });
    
    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    const quickActions = [
        { label: 'Ver Catálogo', icon: ShoppingCart, path: '/catalog', variant: 'outline' },
        { label: 'Mis Borradores', icon: FileText, path: '/requisitions?status=draft', variant: 'outline' },
        { label: 'Plantillas', icon: LayoutTemplate, path: '/templates', variant: 'outline' },
        { label: 'Mi Historial', icon: History, path: '/requisitions', variant: 'outline' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold text-neutral-900">
                        ¡Hola, <span className="bg-gradient-primary bg-clip-text text-transparent">{user.full_name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-base text-neutral-600">
                        Aquí tienes un resumen de tu actividad.
                    </p>
                </div>
                <Button size="lg" className="whitespace-nowrap" onClick={() => navigate('/catalog')}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Crear Nueva Requisición
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Borradores" value={stats?.draft_count || 0} icon={FileText} isLoading={isLoading} />
                <StatCard title="Pendientes" value={stats?.submitted_count || 0} icon={Hourglass} isLoading={isLoading} />
                <StatCard title="Aprobadas (mes)" value={stats?.approved_count || 0} icon={CheckCircle} isLoading={isLoading} />
                <StatCard title="Gasto (mes)" value={stats?.approved_total || 0} icon={CheckCircle} isLoading={isLoading} format={formatCurrency} />
            </div>

            <div className="space-y-6">
                <QuickAccess actions={quickActions} />
                <RecentRequisitions />
            </div>
        </div>
    );
};

export default UserDashboard;
