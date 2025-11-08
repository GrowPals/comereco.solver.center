
import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSupervisorProjectsActivity } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { CheckSquare, FolderKanban, History, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/config/routes.config';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = memo(({ user }) => {
    const navigate = useNavigate();
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats', user.id],
        queryFn: getDashboardStats,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos
    });

    const { data: projects, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['supervisorProjectsActivity'],
        queryFn: getSupervisorProjectsActivity,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos
    });

    const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

    // Calculate trends (mock data for demonstration)
    const calculateTrend = (current, metricType) => {
        const previousPeriod = {
            pending_approvals_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 5)),
            approved_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 3)),
            rejected_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 2)),
            approved_total: Math.max(0, (current || 0) - (Math.random() * 8000))
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
        { label: 'Bandeja de Aprobación', icon: CheckSquare, path: '/approvals', variant: 'default', tone: 'amber' },
        { label: 'Mis Proyectos', icon: FolderKanban, path: '/projects', variant: 'outline', tone: 'sky' },
        { label: 'Historial', icon: History, path: '/requisitions', variant: 'outline', tone: 'violet' },
    ];

    const firstName = user?.full_name?.split(' ')[0] || 'Supervisor';

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 border-b border-border pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Hola</p>
                        <h1 className="page-title">
                            Hola, <span className="page-title-accent">{firstName}</span>
                        </h1>
                        <p className="page-title-subtext">
                            Revisa tus requisiciones pendientes y proyectos asignados.
                        </p>
                    </div>
                    <div className="space-y-1 text-left lg:text-right">
                        <p className="text-sm font-semibold text-muted-foreground">Panel</p>
                        <p className="text-3xl font-bold text-foreground">
                            Panel del <span className="page-title-accent">Supervisor</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Pendientes de Aprobación"
                    value={stats?.pending_approvals_count || 0}
                    icon={Hourglass}
                    iconTone="primary"
                    isLoading={isLoadingStats}
                    trend={calculateTrend(stats?.pending_approvals_count, 'pending_approvals_count')}
                />
                <StatCard
                    title="Aprobadas (mes)"
                    value={stats?.approved_count || 0}
                    icon={CheckCircle}
                    iconTone="primary"
                    isLoading={isLoadingStats}
                    trend={calculateTrend(stats?.approved_count, 'approved_count')}
                    sparklineData={[8, 10, 12, 9, 15, 11, stats?.approved_count || 0]}
                />
                <StatCard
                    title="Rechazadas (mes)"
                    value={stats?.rejected_count || 0}
                    icon={XCircle}
                    iconTone="primary"
                    isLoading={isLoadingStats}
                    trend={calculateTrend(stats?.rejected_count, 'rejected_count')}
                />
                <StatCard
                    title="Monto Aprobado (mes)"
                    value={stats?.approved_total || 0}
                    icon={CheckCircle}
                    iconTone="primary"
                    isLoading={isLoadingStats}
                    format={formatCurrency}
                    trend={calculateTrend(stats?.approved_total, 'approved_total')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <QuickAccess actions={quickActions} />
                    <RecentRequisitions />
                </div>
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                                <FolderKanban className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-lg">Mis Proyectos</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoadingProjects ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                        ) : (
                            projects?.map(p => (
                                <div
                                    key={p.id}
                                    className="group cursor-pointer rounded-lg border border-border bg-[var(--surface-overlay)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                                    onClick={() => navigate(`/projects`)}
                                >
                                    <p className="font-semibold text-sm text-foreground transition-colors group-hover:text-primary-600">{p.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                                </div>
                            ))
                        )}
                        <Button variant="link" size="sm" className="w-full mt-2" onClick={() => navigate(ROUTES.PROJECTS)}>
                            Ver todos los proyectos →
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

SupervisorDashboard.displayName = 'SupervisorDashboard';

export default SupervisorDashboard;
