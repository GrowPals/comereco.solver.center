
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    return (
        <Card interactive className="group stat-card surface-card">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                {Icon && (
                    <StatIcon
                        icon={Icon}
                        tone={iconTone}
                        size={iconSize}
                        className="transition-all duration-300 group-hover:-translate-y-0.5"
                    />
                )}
            </CardHeader>
            <CardContent className="relative z-10">
                <CardTitle className="caption mb-2">
                    {title}
                </CardTitle>
                <div className="mb-2 display-number">
                    {format(value)}
                </div>

                {/* Trend Indicator */}
                {trend && (
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${getTrendColor()}`}>
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

                {/* Animated accent bar */}
                {!sparklineData && (
                    <div className="mt-3 h-1 w-16 rounded-full bg-gradient-primary transition-all duration-300 group-hover:w-full"></div>
                )}
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
