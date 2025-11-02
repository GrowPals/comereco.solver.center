
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSupervisorProjectsActivity } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { CheckSquare, FolderKanban, History, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = ({ user }) => {
    const navigate = useNavigate();
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
    });
    
    const { data: projects, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['supervisorProjectsActivity'],
        queryFn: getSupervisorProjectsActivity,
    });

    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    const quickActions = [
        { label: 'Bandeja de Aprobación', icon: CheckSquare, path: '/approvals', variant: 'default' },
        { label: 'Mis Proyectos', icon: FolderKanban, path: '/projects', variant: 'outline' },
        { label: 'Historial', icon: History, path: '/requisitions', variant: 'outline' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard de Supervisor</h1>
                <p className="text-muted-foreground">Bienvenido, {user.full_name}. Revisa las requisiciones pendientes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Pendientes de Aprobación" value={stats?.pending_approvals_count || 0} icon={Hourglass} isLoading={isLoadingStats} />
                <StatCard title="Aprobadas (mes)" value={stats?.approved_count || 0} icon={CheckCircle} isLoading={isLoadingStats} />
                <StatCard title="Rechazadas (mes)" value={stats?.rejected_count || 0} icon={XCircle} isLoading={isLoadingStats} />
                <StatCard title="Monto Aprobado (mes)" value={stats?.approved_total || 0} icon={CheckCircle} isLoading={isLoadingStats} format={formatCurrency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <QuickAccess actions={quickActions} />
                    <RecentRequisitions />
                </div>
                <Card>
                    <CardHeader><CardTitle>Mis Proyectos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingProjects ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                        ) : (
                            projects?.map(p => (
                                <div key={p.id} className="p-3 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate(`/projects`)}>
                                    <p className="font-semibold text-sm">{p.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                                </div>
                            ))
                        )}
                        <Button variant="link" size="sm" className="w-full" onClick={() => navigate('/projects')}>Ver todos los proyectos</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SupervisorDashboard;
