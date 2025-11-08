
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IconToken } from '@/components/ui/icon-token';

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
        <Card interactive className="group stat-card">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                {Icon && <IconToken icon={Icon} size="md" aria-hidden="true" />}
            </CardHeader>
            <CardContent className="relative z-10">
                <CardTitle className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">
                    {format(value)}
                </div>
                <div className="mt-3 h-1 w-16 rounded-full bg-primary/20 transition-all duration-300 group-hover:w-full"></div>
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
