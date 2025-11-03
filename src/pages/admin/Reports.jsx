
import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart2,
    TrendingUp,
    FileText,
    Users,
    DollarSign,
    CheckCircle2,
    Clock,
    Package,
    Loader2,
    AlertCircle
} from 'lucide-react';
import {
    getGeneralStats,
    getRequisitionsByStatus,
    getMonthlyRequisitionsAmount,
    getTopProducts,
    getRequisitionsByUser
} from '@/services/reportsService';
import PageLoader from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Componente de tarjeta de estadística
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend }) => {
    const colorClasses = {
        blue: 'from-blue-50 to-blue-100 text-blue-600',
        green: 'from-green-50 to-green-100 text-green-600',
        amber: 'from-amber-50 to-amber-100 text-amber-600',
        purple: 'from-purple-50 to-purple-100 text-purple-600',
    };

    return (
        <Card className="overflow-hidden border-2 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-slate-500">{subtitle}</p>
                        )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-md`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Componente de gráfico de barras simple (sin dependencias externas)
const SimpleBarChart = ({ data, title, subtitle, dataKey, nameKey }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-slate-500">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0));

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => {
                        const value = item[dataKey] || 0;
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700">{item[nameKey]}</span>
                                    <span className="font-bold text-slate-900">{value}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

// Componente de gráfico de tendencias mensuales
const MonthlyTrendChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Tendencia Mensual</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-slate-500">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(
        ...data.flatMap(d => [d.aprobadas || 0, d.pendientes || 0])
    );

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Tendencia de Requisiciones (Últimos 6 Meses)
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">Montos en MXN</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex gap-4 justify-end">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-slate-600">Aprobadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-xs font-medium text-slate-600">Pendientes</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {data.map((item, index) => {
                            const approvedPercentage = maxValue > 0 ? ((item.aprobadas || 0) / maxValue) * 100 : 0;
                            const pendingPercentage = maxValue > 0 ? ((item.pendientes || 0) / maxValue) * 100 : 0;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-900 w-16">{item.mes}</span>
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-green-700 font-semibold">
                                                ${item.aprobadas.toLocaleString('es-MX')}
                                            </span>
                                            <span className="text-amber-700 font-semibold">
                                                ${item.pendientes.toLocaleString('es-MX')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 h-8">
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-green-500 rounded-lg transition-all duration-500 flex items-center justify-center"
                                            style={{ width: `${approvedPercentage}%` }}
                                        >
                                            {approvedPercentage > 15 && (
                                                <span className="text-xs font-bold text-white">
                                                    ${item.aprobadas.toLocaleString('es-MX')}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg transition-all duration-500 flex items-center justify-center"
                                            style={{ width: `${pendingPercentage}%` }}
                                        >
                                            {pendingPercentage > 15 && (
                                                <span className="text-xs font-bold text-white">
                                                    ${item.pendientes.toLocaleString('es-MX')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Componente de gráfico de pie simple
const SimplePieChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Requisiciones por Estado</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-slate-500">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle>Distribución de Requisiciones</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Total: {total} requisiciones</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {percentage}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: item.color
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

const ReportsPage = () => {
    // Queries para obtener datos
    const { data: generalStats, isLoading: loadingStats } = useQuery({
        queryKey: ['generalStats'],
        queryFn: getGeneralStats,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const { data: statusData, isLoading: loadingStatus } = useQuery({
        queryKey: ['requisitionsByStatus'],
        queryFn: getRequisitionsByStatus,
        staleTime: 1000 * 60 * 5,
    });

    const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
        queryKey: ['monthlyRequisitions'],
        queryFn: getMonthlyRequisitionsAmount,
        staleTime: 1000 * 60 * 10,
    });

    const { data: topProducts, isLoading: loadingProducts } = useQuery({
        queryKey: ['topProducts'],
        queryFn: () => getTopProducts(8),
        staleTime: 1000 * 60 * 10,
    });

    const { data: topUsers, isLoading: loadingUsers } = useQuery({
        queryKey: ['topUsers'],
        queryFn: getRequisitionsByUser,
        staleTime: 1000 * 60 * 10,
    });

    const isLoading = loadingStats || loadingStatus || loadingMonthly || loadingProducts || loadingUsers;

    if (isLoading) {
        return <PageLoader message="Cargando reportes y analíticas..." />;
    }

    return (
        <>
            <Helmet><title>Reportes y Analíticas - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <BarChart2 className="h-7 w-7 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1">
                                    Reportes y <span className="bg-gradient-primary bg-clip-text text-transparent">Analíticas</span>
                                </h1>
                                <p className="text-base sm:text-lg text-slate-600">
                                    Visualiza el desempeño y tendencias de tu organización
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={FileText}
                            title="Total Requisiciones"
                            value={generalStats?.totalRequisitions?.toLocaleString('es-MX') || '0'}
                            subtitle="Todas las requisiciones"
                            color="blue"
                        />
                        <StatCard
                            icon={DollarSign}
                            title="Monto Aprobado"
                            value={`$${generalStats?.totalApproved?.toLocaleString('es-MX') || '0'}`}
                            subtitle="Requisiciones aprobadas"
                            color="green"
                        />
                        <StatCard
                            icon={Clock}
                            title="Pendientes"
                            value={generalStats?.pendingApprovals?.toLocaleString('es-MX') || '0'}
                            subtitle="Esperando aprobación"
                            color="amber"
                        />
                        <StatCard
                            icon={Users}
                            title="Usuarios Activos"
                            value={generalStats?.activeUsers?.toLocaleString('es-MX') || '0'}
                            subtitle="En tu organización"
                            color="purple"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart - Status Distribution */}
                        <SimplePieChart data={statusData} />

                        {/* Top Users */}
                        <SimpleBarChart
                            data={topUsers || []}
                            title="Usuarios Más Activos"
                            subtitle="Top 5 usuarios por número de requisiciones"
                            dataKey="total"
                            nameKey="nombre"
                        />
                    </div>

                    {/* Monthly Trend - Full Width */}
                    <MonthlyTrendChart data={monthlyData} />

                    {/* Top Products - Full Width */}
                    <SimpleBarChart
                        data={topProducts || []}
                        title="Productos Más Solicitados"
                        subtitle="Top 8 productos por cantidad en requisiciones aprobadas"
                        dataKey="cantidad"
                        nameKey="producto"
                    />

                    {/* Info Footer */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Actualizaciones automáticas</h3>
                                <p className="text-sm text-slate-600">
                                    Los datos en esta página se actualizan automáticamente cada 5 minutos.
                                    Los reportes reflejan únicamente los datos de tu organización gracias a nuestro sistema de seguridad RLS (Row Level Security).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReportsPage;
