import React, { useMemo } from 'react';
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
    
    const formatCurrency = useMemo(() => (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00', []);

    const firstName = useMemo(() => {
        return user?.full_name?.split(' ')[0] || 'Usuario';
    }, [user?.full_name]);

    const quickActions = useMemo(() => [
        { label: 'Nueva Requisición', icon: ShoppingCart, path: '/catalog' },
        { label: 'Mis Plantillas', icon: LayoutTemplate, path: '/templates' },
        { label: 'Mi Historial', icon: History, path: '/requisitions', variant: 'outline' },
    ], []);

    const handleNavigateToCatalog = useMemo(() => () => navigate('/catalog'), [navigate]);

    return (
        <div className="mx-auto max-w-7xl space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col items-start gap-6 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between dark:border-border">
                <div className="flex flex-col gap-3">
                    <h1 className="text-5xl font-bold tracking-tight text-foreground">
                        Hola, <span className="bg-gradient-primary bg-clip-text text-transparent">{firstName}</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Gestiona tus requisiciones y revisa tu actividad reciente
                    </p>
                </div>
                <Button size="lg" className="whitespace-nowrap shadow-lg" onClick={handleNavigateToCatalog}>
                    <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" /> Nueva Requisición
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Borradores" value={stats?.draft_count || 0} icon={FileText} isLoading={isLoading} />
                <StatCard title="Pendientes" value={stats?.submitted_count || 0} icon={Hourglass} isLoading={isLoading} />
                <StatCard title="Aprobadas" value={stats?.approved_count || 0} icon={CheckCircle} isLoading={isLoading} />
                <StatCard title="Gasto Total" value={stats?.approved_total || 0} icon={CheckCircle} isLoading={isLoading} format={formatCurrency} />
            </div>

            {/* Content Sections */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <RecentRequisitions />
                </div>
                <div>
                    <QuickAccess actions={quickActions} />
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
