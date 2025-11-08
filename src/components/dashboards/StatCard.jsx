
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Paleta de colores pastel para iconos
const iconColors = [
  'text-blue-300 dark:text-blue-400',
  'text-emerald-300 dark:text-emerald-400',
  'text-violet-300 dark:text-violet-400',
  'text-rose-300 dark:text-rose-400',
  'text-amber-300 dark:text-amber-400',
  'text-cyan-300 dark:text-cyan-400',
  'text-pink-300 dark:text-pink-400',
  'text-teal-300 dark:text-teal-400',
];

const StatCard = memo(({
    title,
    value,
    icon: Icon,
    isLoading,
    format = val => val,
    trend = null, // { direction: 'up' | 'down' | 'neutral', percentage: number, label: string }
    comparison = null, // { value: number, label: string }
    sparklineData = null, // array of numbers for mini chart
    iconColorIndex = 0 // índice para seleccionar color del icono
}) => {
    if (isLoading) {
        return (
        <Card className="dashboard-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-32 mb-2" />
                    <Skeleton className="h-4 w-28 mt-2" />
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend.direction) {
            case 'up':
                return <TrendingUp className="h-4 w-4" />;
            case 'down':
                return <TrendingDown className="h-4 w-4" />;
            default:
                return <Minus className="h-4 w-4" />;
        }
    };

    const getTrendColor = () => {
        if (!trend) return '';
        switch (trend.direction) {
            case 'up':
                return 'text-success-600 dark:text-success-400';
            case 'down':
                return 'text-destructive dark:text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    const iconColorClass = iconColors[iconColorIndex % iconColors.length];

    return (
        <Card className="group stat-card">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                {Icon && (
                    <div className="transition-transform duration-300 group-hover:scale-110">
                        <Icon className={cn("w-12 h-12", iconColorClass)} />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10">
                <CardTitle className="caption mb-2 text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="mb-2 text-heading-2 font-bold text-foreground">
                    {format(value)}
                </div>

                {/* Trend Indicator */}
                {trend && (
                    <div className={cn("flex items-center gap-1.5 text-sm font-semibold", getTrendColor())}>
                        {getTrendIcon()}
                        <span>{trend.percentage > 0 ? '+' : ''}{trend.percentage}%</span>
                        {trend.label && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                                {trend.label}
                            </span>
                        )}
                    </div>
                )}

                {/* Comparison */}
                {comparison && !trend && (
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{format(comparison.value)}</span>
                        {comparison.label && <span className="ml-1">{comparison.label}</span>}
                    </div>
                )}

                {/* Sparkline - Simple bars visualization */}
                {sparklineData && sparklineData.length > 0 && (
                    <div className="mt-3 flex h-8 items-end gap-0.5">
                        {sparklineData.map((val, idx) => {
                            const maxVal = Math.max(...sparklineData);
                            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
                            return (
                                <div
                                    key={idx}
                                    className="flex-1 rounded-sm bg-primary/30 transition-all duration-200 group-hover:bg-primary/50"
                                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '2px' }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Animated accent bar - usando gradient pastel */}
                {!sparklineData && (
                    <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary-200 to-primary-400 dark:from-primary-400 dark:to-primary-600 transition-all duration-300 group-hover:w-full"></div>
                )}
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
