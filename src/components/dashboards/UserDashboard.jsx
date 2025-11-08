import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getDashboardStats } from '@/services/dashboardService';
import StatCard from './StatCard';
import QuickAccess from './QuickAccess';
import RecentRequisitions from './RecentRequisitions';
import { FileText, Hourglass, CheckCircle, XCircle, ShoppingCart, LayoutTemplate, History, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes.config';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

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

    // Calculate trends (mock data for demonstration)
    const calculateTrend = useMemo(() => (current, metricType) => {
        const previousPeriod = {
            draft_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 3)),
            submitted_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 2)),
            approved_count: Math.max(0, (current || 0) - Math.floor(Math.random() * 4)),
            approved_total: Math.max(0, (current || 0) - (Math.random() * 5000))
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
    }, []);

    // Check if user is new (no requisitions at all)
    const isNewUser = useMemo(() => {
        if (!stats || isLoading) return false;
        return (stats.draft_count || 0) === 0 &&
               (stats.submitted_count || 0) === 0 &&
               (stats.approved_count || 0) === 0;
    }, [stats, isLoading]);

    const quickActions = useMemo(() => [
        { label: 'Nueva Requisición', icon: ShoppingCart, path: '/catalog', tone: 'primary' },
        { label: 'Mis Plantillas', icon: LayoutTemplate, path: '/templates', tone: 'violet' },
        { label: 'Mi Historial', icon: History, path: '/requisitions', variant: 'outline', tone: 'sky' },
    ], []);

    const handleNavigateToCatalog = useMemo(() => () => navigate(ROUTES.CATALOG), [navigate]);

    return (
        <div className="mx-auto max-w-7xl space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col items-start gap-6 border-b border-border pb-8 dark:border-border">
                <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3">
                        <h1 className="page-title">
                            Hola, <span className="page-title-accent">{firstName}</span>
                        </h1>
                        <p className="page-title-subtext">
                            Gestiona tus requisiciones y revisa tu actividad reciente
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button size="lg" className="whitespace-nowrap shadow-soft-md" onClick={handleNavigateToCatalog}>
                            <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" /> Nueva Requisición
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Borradores"
                    value={stats?.draft_count || 0}
                    icon={FileText}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.draft_count, 'draft_count')}
                />
                <StatCard
                    title="Pendientes"
                    value={stats?.submitted_count || 0}
                    icon={Hourglass}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.submitted_count, 'submitted_count')}
                />
                <StatCard
                    title="Aprobadas"
                    value={stats?.approved_count || 0}
                    icon={CheckCircle}
                    iconTone="primary"
                    isLoading={isLoading}
                    trend={calculateTrend(stats?.approved_count, 'approved_count')}
                    sparklineData={[3, 5, 4, 7, 6, 8, stats?.approved_count || 0]}
                />
                <StatCard
                    title="Gasto Total"
                    value={stats?.approved_total || 0}
                    icon={Sparkles}
                    iconTone="primary"
                    isLoading={isLoading}
                    format={formatCurrency}
                    trend={calculateTrend(stats?.approved_total, 'approved_total')}
                />
            </div>

            {/* Onboarding for New Users */}
            {isNewUser && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="surface-card relative overflow-hidden border-2 border-primary-300/40 bg-gradient-to-br from-primary-50/80 via-background to-background p-8 sm:p-12 dark:border-primary-500/30 dark:from-primary-900/10 dark:via-card dark:to-card">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow-primary">
                                    <Sparkles className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                                        ¡Bienvenido a ComerECO!
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Comienza tu primera requisición</p>
                                </div>
                            </div>

                            <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                                Estás a un paso de crear tu primera requisición. Navega por nuestro catálogo,
                                selecciona los productos que necesitas y envía tu solicitud para aprobación.
                                ¡Es rápido y sencillo!
                            </p>

                            <div className="grid gap-4 sm:grid-cols-3 mb-8">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 dark:bg-card/40">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <ShoppingCart className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground mb-1">Explora el catálogo</h3>
                                        <p className="text-xs text-muted-foreground">Encuentra productos y servicios</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 dark:bg-card/40">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground mb-1">Crea tu requisición</h3>
                                        <p className="text-xs text-muted-foreground">Añade items y detalles</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 dark:bg-card/40">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground mb-1">Envía y aprueba</h3>
                                        <p className="text-xs text-muted-foreground">Rastrea tu solicitud</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    className="shadow-glow-primary group"
                                    onClick={handleNavigateToCatalog}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Crear mi primera requisición
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate(ROUTES.TEMPLATES)}
                                >
                                    <LayoutTemplate className="mr-2 h-5 w-5" />
                                    Ver plantillas
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

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
