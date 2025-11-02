
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
        <Card interactive className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 mb-1 tracking-tight">
                    {format(value)}
                </div>
                <div className="w-16 h-1 bg-gradient-primary rounded-full mt-3 transition-all duration-300 group-hover:w-full"></div>
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;
