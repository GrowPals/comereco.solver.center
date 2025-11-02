
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = memo(({ title, value, icon: Icon, isLoading, format = val => val }) => {
    if (isLoading) {
        return (
            <Card>
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
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                <CardTitle className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 transition-all duration-300">
                        <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-neutral-900 mb-1">
                    {format(value)}
                </div>
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
