
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = memo(({ title, value, icon: Icon, isLoading, format = val => val }) => {
    if (isLoading) {
        return (
        <Card className="dashboard-panel surface-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-32 mb-2" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card interactive className="group stat-card surface-card">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="stat-icon flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-6 w-6 text-primary-500 dark:text-primary-200" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="mb-1 text-4xl font-bold tracking-tight text-foreground">
                    {format(value)}
                </div>
                <div className="mt-3 h-1 w-16 rounded-full bg-gradient-primary transition-all duration-300 group-hover:w-full"></div>
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
