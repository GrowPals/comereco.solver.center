
import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import CompanyContextIndicator from '@/components/layout/CompanyContextIndicator';
import { Users, FolderKanban, FileText, ShoppingBag, BarChart2 } from 'lucide-react';

const AdminDashboard = memo(({ user }) => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos
    });

    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    const quickActions = [
        { label: 'Gestionar requisiciones', icon: FileText, path: '/requisitions' },
        { label: 'Gestionar Usuarios', icon: Users, path: '/users' },
        { label: 'Gestionar Proyectos', icon: FolderKanban, path: '/projects' },
        { label: 'Gestionar Productos', icon: ShoppingBag, path: '/products/manage' },
        { label: 'Reportes', icon: BarChart2, path: '/reports', variant: 'secondary' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col gap-4 pb-8 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Panel <span className="bg-gradient-primary bg-clip-text text-transparent">Ejecutivo</span>
                        </h1>
                        <p className="mt-3 text-lg text-muted-foreground">
                            Vista general de la compañía: <span className="font-semibold text-foreground">{user.company?.name || 'Tu Empresa'}</span>
                        </p>
                    </div>
                    <CompanyContextIndicator className="flex-shrink-0" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Requisiciones Activas" value={stats?.active_requisitions_count || 0} icon={FileText} isLoading={isLoading} />
                <StatCard title="Total de Usuarios" value={stats?.total_users_count || 0} icon={Users} isLoading={isLoading} />
                <StatCard title="Total de Proyectos" value={stats?.total_projects_count || 0} icon={FolderKanban} isLoading={isLoading} />
                <StatCard title="Monto Aprobado (mes)" value={stats?.approved_total || 0} icon={FileText} isLoading={isLoading} format={formatCurrency} />
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
