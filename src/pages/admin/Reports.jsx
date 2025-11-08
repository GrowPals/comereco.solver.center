
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
    AlertCircle,
    Download,
    FileSpreadsheet,
    RefreshCw
} from 'lucide-react';
import {
    getGeneralStats,
    getRequisitionsByStatus,
    getMonthlyRequisitionsAmount,
    getTopProducts,
    getRequisitionsByUser
} from '@/services/reportsService';
import PageLoader from '@/components/PageLoader';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logger from '@/utils/logger';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { IconToken } from '@/components/ui/icon-token';

// Componente de tarjeta de estadística
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend }) => {
    const colorClasses = {
        blue: 'text-primary-600 dark:text-primary-100',
        green: 'text-emerald-600 dark:text-emerald-200',
        amber: 'text-amber-600 dark:text-amber-200',
        purple: 'text-purple-600 dark:text-purple-200',
    };

    return (
        <Card className="overflow-hidden surface-card transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
                        <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground/80">{subtitle}</p>
                        )}
                    </div>
                    <IconToken
                        icon={Icon}
                        size="md"
                        className={colorClasses[color]}
                        aria-hidden="true"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

// Componente de gráfico de barras simple (sin dependencias externas)
// Usando variables CSS theme-aware para gradientes
const SimpleBarChart = ({ data, title, subtitle, dataKey, nameKey }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="surface-card">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground/80">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0));

    return (
        <Card className="surface-card">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {data.map((item, index) => {
                        const value = item[dataKey] || 0;
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                        return (
                            <div key={index} className="space-y-3">
                                <div className="flex items-baseline justify-between text-sm">
                                    <span className="font-medium text-foreground/90 leading-tight">{item[nameKey]}</span>
                                    <span className="font-semibold text-foreground">{value}</span>
                                </div>
                                <div className="w-full h-3.5 rounded-full bg-muted/80">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%`, background: 'var(--gradient-chart-bar)' }}
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
            <Card className="surface-card">
                <CardHeader>
                    <CardTitle>Tendencia Mensual</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground/80">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(
        ...data.flatMap(d => [d.aprobadas || 0, d.pendientes || 0])
    );

    return (
        <Card className="surface-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    Tendencia de Requisiciones (Últimos 6 Meses)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Montos en MXN</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ background: 'var(--gradient-chart-approved)' }} />
                            <span className="text-xs font-medium text-muted-foreground">Aprobadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ background: 'var(--gradient-chart-pending)' }} />
                            <span className="text-xs font-medium text-muted-foreground">Pendientes</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {data.map((item, index) => {
                            const approvedValue = item.aprobadas || 0;
                            const pendingValue = item.pendientes || 0;
                            const approvedPercentage = maxValue > 0 ? (approvedValue / maxValue) * 100 : 0;
                            const pendingPercentage = maxValue > 0 ? (pendingValue / maxValue) * 100 : 0;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-foreground w-16">{item.mes}</span>
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-foreground/90 font-semibold">
                                                ${formatNumber(approvedValue)}
                                            </span>
                                            <span className="text-muted-foreground font-semibold">
                                                ${formatNumber(pendingValue)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex h-8 gap-1">
                                        <div
                                            className="flex items-center justify-center rounded-lg px-2 text-xs font-semibold text-white transition-all duration-500"
                                            style={{ width: `${approvedPercentage}%`, background: 'var(--gradient-chart-approved)' }}
                                        >
                                            {approvedPercentage > 15 && (
                                                <span>
                                                    ${formatNumber(approvedValue)}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="flex items-center justify-center rounded-lg px-2 text-xs font-semibold text-white transition-all duration-500"
                                            style={{ width: `${pendingPercentage}%`, background: 'var(--gradient-chart-pending)' }}
                                        >
                                            {pendingPercentage > 15 && (
                                                <span>
                                                    ${formatNumber(pendingValue)}
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
            <Card className="surface-card">
                <CardHeader>
                    <CardTitle>Requisiciones por Estado</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground/80">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="surface-card">
            <CardHeader>
                <CardTitle>Distribución de Requisiciones</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Total: {total} requisiciones</p>
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
                                        <span className="text-sm font-medium text-foreground/90">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-foreground">{item.value}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {percentage}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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
    const { toast } = useToast();

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

    const { data: topUsers, isLoading: loadingUsers, isError: errorUsers } = useQuery({
        queryKey: ['topUsers'],
        queryFn: getRequisitionsByUser,
        staleTime: 1000 * 60 * 10,
    });

    const isLoading = loadingStats || loadingStatus || loadingMonthly || loadingProducts || loadingUsers;
    const isError = errorUsers; // Podemos expandir esto para incluir otros errores si es necesario

    if (isLoading) {
        return <PageLoader message="Cargando reportes y analíticas..." />;
    }

    if (isError) {
        return (
            <PageContainer>
                <div className="mx-auto max-w-2xl p-8 text-center">
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 dark:border-red-400/60 dark:bg-red-500/10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-100">
                            Error al cargar reportes
                        </h2>
                        <p className="mb-6 text-red-700 dark:text-red-200">
                            No se pudieron cargar los datos de analíticas. Por favor, intenta nuevamente.
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="destructive"
                            size="lg"
                            className="rounded-xl"
                        >
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Reintentar
                        </Button>
                    </div>
                </div>
            </PageContainer>
        );
    }

    // Función para exportar a CSV/Excel
    const exportToExcel = () => {
        try {
            // Preparar datos para CSV
            const csvData = [];

            // Encabezados generales
            csvData.push(['REPORTE DE ANALÍTICAS - COMERCO']);
            csvData.push(['Fecha de generación:', new Date().toLocaleDateString('es-ES')]);
            csvData.push([]);

            // Estadísticas generales
            csvData.push(['ESTADÍSTICAS GENERALES']);
            csvData.push(['Total Requisiciones', generalStats?.totalRequisitions || 0]);
            csvData.push(['Monto Total Aprobado', generalStats?.totalApproved || 0]);
            csvData.push(['Pendientes de Aprobación', generalStats?.pendingApprovals || 0]);
            csvData.push(['Usuarios Activos', generalStats?.activeUsers || 0]);
            csvData.push([]);

            // Requisiciones por mes
            csvData.push(['REQUISICIONES POR MES']);
            csvData.push(['Mes', 'Aprobadas', 'Pendientes']);
            monthlyData?.forEach(item => {
                csvData.push([item.mes, item.aprobadas, item.pendientes]);
            });
            csvData.push([]);

            // Productos más solicitados
            csvData.push(['PRODUCTOS MÁS SOLICITADOS']);
            csvData.push(['Producto', 'Cantidad']);
            topProducts?.forEach(item => {
                csvData.push([item.producto, item.cantidad]);
            });
            csvData.push([]);

            // Top usuarios
            csvData.push(['REQUISICIONES POR USUARIO']);
            csvData.push(['Usuario', 'Total Requisiciones']);
            topUsers?.forEach(item => {
                csvData.push([item.nombre, item.total]);
            });

            // Convertir a CSV
            const csvContent = csvData.map(row => row.join(',')).join('\n');

            // Crear blob y descargar
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `reporte_comerco_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            toast({
                title: 'Exportación exitosa',
                description: 'El reporte se ha descargado como archivo CSV.',
                variant: 'success'
            });
        } catch (error) {
            logger.error('Error exporting to Excel:', error);
            toast({
                title: 'Error al exportar',
                description: 'No se pudo generar el archivo de exportación.',
                variant: 'destructive'
            });
        }
    };

    // Función para exportar a PDF
    const exportToPDF = () => {
        toast({
            title: 'Función en desarrollo',
            description: 'La exportación a PDF estará disponible próximamente. Use la exportación a Excel por ahora.',
            variant: 'info'
        });
    };

    return (
        <>
            <Helmet><title>Reportes y Analíticas - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="flex flex-col items-start gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <IconToken icon={BarChart2} size="lg" aria-hidden="true" />
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">
                                    Reportes y <span className="bg-gradient-primary bg-clip-text text-transparent">Analíticas</span>
                                </h1>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    Visualiza el desempeño y tendencias de tu organización
                                </p>
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={exportToExcel}
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700 sm:w-auto"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Exportar Excel
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Descargar reporte completo en formato CSV/Excel</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={exportToPDF}
                                            variant="outline"
                                            className="w-full border-2 hover:bg-muted/70 sm:w-auto"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Exportar PDF
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Función en desarrollo - próximamente disponible</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={FileText}
                            title="Total Requisiciones"
                            value={formatNumber(generalStats?.totalRequisitions || 0)}
                            subtitle="Todas las requisiciones"
                            color="blue"
                        />
                        <StatCard
                            icon={DollarSign}
                            title="Monto Aprobado"
                            value={`$${formatNumber(generalStats?.totalApproved || 0)}`}
                            subtitle="Requisiciones aprobadas"
                            color="green"
                        />
                        <StatCard
                            icon={Clock}
                            title="Pendientes"
                            value={formatNumber(generalStats?.pendingApprovals || 0)}
                            subtitle="Esperando aprobación"
                            color="amber"
                        />
                        <StatCard
                            icon={Users}
                            title="Usuarios Activos"
                            value={formatNumber(generalStats?.activeUsers || 0)}
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-colors dark:border-[rgba(66,84,112,0.55)] dark:bg-[rgba(18,25,41,0.92)] dark:shadow-[0_20px_45px_rgba(5,10,24,0.35)]">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center dark:bg-info/20">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-1">Actualizaciones automáticas</h3>
                                <p className="text-sm text-muted-foreground">
                                    Los datos en esta página se actualizan automáticamente cada 5 minutos.
                                    Los reportes reflejan únicamente los datos de tu organización gracias a nuestro sistema de seguridad RLS (Row Level Security).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
};

export default ReportsPage;
