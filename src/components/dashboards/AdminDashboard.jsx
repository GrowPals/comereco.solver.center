
import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { Users, FolderKanban, FileText, ShoppingBag, BarChart2 } from 'lucide-react';

const AdminDashboard = memo(({ user }) => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos
    });

    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    const firstName = user?.full_name?.split(' ')[0] || 'Usuario';

    // Calculate trends (in production, this would come from the backend)
    const calculateTrend = (current, metricType) => {
        // Mock previous period values for demonstration
        const previousPeriod = {
            active_requisitions_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 5)),
            total_users_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 3)),
            total_projects_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 2)),
            approved_total: Math.max(0, (current || 0) - (Math.random() * 10000))
        };

        const previous = previousPeriod[metricType] || 0;
        if (previous === 0 && current === 0) return null;
        if (previous === 0) return { direction: 'up', percentage: 100, label: 'vs mes anterior' };

        const percentageChange = Math.round(((current - previous) / previous) * 100);
        return {
            direction: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral',
            percentage: Math.abs(percentageChange),
            label: 'vs mes anterior'
        };
    };

    const quickActions = [
        { label: 'Gestionar requisiciones', icon: FileText, path: '/requisitions', tone: 'violet' },
        { label: 'Gestionar Usuarios', icon: Users, path: '/users', tone: 'sky' },
        { label: 'Gestionar Proyectos', icon: FolderKanban, path: '/projects', tone: 'amber' },
        { label: 'Gestionar Productos', icon: ShoppingBag, path: '/products/manage', tone: 'rose' },
            { label: 'Reportes', icon: BarChart2, path: '/reports', variant: 'secondary', tone: 'slate' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col gap-6 border-b border-border pb-8">
                <div className="space-y-3 max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bienvenido</p>
                    <h1 className="page-title">
                        Hola, <span className="page-title-accent">{firstName}</span>
                    </h1>
                    <p className="page-title-subtext">
                        Panel ejecutivo para monitorear requisiciones, equipos y presupuesto en tiempo real.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Requisiciones Activas"
                    value={stats?.active_requisitions_count || 0}
                    icon={FileText}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.active_requisitions_count, 'active_requisitions_count')}
                    sparklineData={[12, 15, 18, 14, 20, 18, stats?.active_requisitions_count || 0]}
                />
                <StatCard
                    title="Total de Usuarios"
                    value={stats?.total_users_count || 0}
                    icon={Users}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.total_users_count, 'total_users_count')}
                />
                <StatCard
                    title="Total de Proyectos"
                    value={stats?.total_projects_count || 0}
                    icon={FolderKanban}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.total_projects_count, 'total_projects_count')}
                />
                <StatCard
                    title="Monto Aprobado (mes)"
                    value={stats?.approved_total || 0}
                    icon={FileText}
                    iconTone="primary"
                    isLoading={isLoading}
                    format={formatCurrency}
                    trend={calculateTrend(stats?.approved_total, 'approved_total')}
                />
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
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
