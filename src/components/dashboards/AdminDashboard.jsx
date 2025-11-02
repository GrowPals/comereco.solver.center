
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { Users, FolderKanban, FileText, ShoppingBag, BarChart2 } from 'lucide-react';

const AdminDashboard = ({ user }) => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
    });

    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    const quickActions = [
        { label: 'Gestionar Reqs', icon: FileText, path: '/requisitions' },
        { label: 'Gestionar Usuarios', icon: Users, path: '/users' },
        { label: 'Gestionar Proyectos', icon: FolderKanban, path: '/projects' },
        { label: 'Gestionar Productos', icon: ShoppingBag, path: '/products/manage' },
        { label: 'Reportes', icon: BarChart2, path: '/reports', variant: 'secondary' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-neutral-900">
                    Dashboard <span className="bg-gradient-primary bg-clip-text text-transparent">Ejecutivo</span>
                </h1>
                <p className="text-base text-neutral-600">
                    Vista general de la compañía: <span className="font-semibold text-neutral-900">{user.company?.name || ''}</span>
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Requisiciones Activas" value={stats?.active_requisitions_count || 0} icon={FileText} isLoading={isLoading} />
                <StatCard title="Total de Usuarios" value={stats?.total_users_count || 0} icon={Users} isLoading={isLoading} />
                <StatCard title="Total de Proyectos" value={stats?.total_projects_count || 0} icon={FolderKanban} isLoading={isLoading} />
                <StatCard title="Monto Aprobado (mes)" value={stats?.approved_total || 0} icon={FileText} isLoading={isLoading} format={formatCurrency} />
            </div>
            
            <div className="space-y-6">
                <QuickAccess actions={quickActions} />
                <RecentRequisitions />
            </div>
        </div>
    );
};

export default AdminDashboard;
