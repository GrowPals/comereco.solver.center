
import React, { memo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatIcon } from '@/components/ui/icon-wrapper';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = memo(({
    title,
    value,
    icon: Icon,
    iconTone = 'primary',
    iconSize = 'lg',
    isLoading,
    format = val => val,
    trend = null, // { direction: 'up' | 'down' | 'neutral', percentage: number, label: string }
    comparison = null, // { value: number, label: string }
    sparklineData = null // array de números para mini chart
}) => {
    if (isLoading) {
        return (
        <Card className="dashboard-panel surface-card">
                <CardContent className="flex flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-28" />
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

    return (
        <Card interactive className="group stat-card surface-card overflow-hidden">
            <CardContent className="relative z-10 flex flex-col justify-between p-4 sm:p-5 h-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="caption text-[10px] tracking-[0.22em] text-muted-foreground">
                            {title}
                        </CardTitle>
                        <div className="display-number leading-tight">
                            {format(value)}
                        </div>
                    </div>
                    {Icon && (
                        <StatIcon
                            icon={Icon}
                            tone={iconTone}
                            size="md"
                            glow={false}
                            className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 text-primary-500 dark:text-primary-400"
                        />
                    )}
                </div>

                <div className="mt-2">
                    {trend && (
                        <div className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span>{trend.percentage > 0 ? '+' : ''}{trend.percentage}%</span>
                            {trend.label && (
                                <span className="text-[11px] font-normal text-muted-foreground ml-1">
                                    {trend.label}
                                </span>
                            )}
                        </div>
                    )}
                    {comparison && !trend && (
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{format(comparison.value)}</span>
                            {comparison.label && <span className="ml-1">{comparison.label}</span>}
                        </div>
                    )}
                    
                    {!trend && !comparison && (
                         <div className="h-5" /> // Placeholder to maintain height
                    )}
                </div>
                 {/* Animated accent bar */}
                <div className="absolute bottom-0 left-0 h-1 w-1/3 rounded-full bg-gradient-primary transition-all duration-300 group-hover:w-full"></div>
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
