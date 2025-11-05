
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const QuickAccess = memo(({ actions = [] }) => {
    const navigate = useNavigate();

    const handleActionClick = useCallback((path) => {
        if (path) {
            navigate(path);
        }
    }, [navigate]);

    if (!actions || actions.length === 0) {
        return null;
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
                        <Zap className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">Acceso Rápido</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-1 gap-3">
                    {actions.map((action) => {
                        if (!action) return null;
                        const ActionIcon = action.icon;
                        const uniqueKey = action.path || action.label;
                        return (
                            <button
                                key={uniqueKey}
                                onClick={() => handleActionClick(action.path)}
                                className="group flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-border dark:bg-card"
                                aria-label={action.label || 'Acción rápida'}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 transition-transform duration-200 group-hover:scale-110 dark:from-primary-500/15 dark:to-primary-600/10">
                                    {ActionIcon && <ActionIcon className="h-6 w-6 text-primary-500" aria-hidden="true" />}
                                </div>
                                <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary-500">
                                    {action.label || 'Acción'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
});

QuickAccess.displayName = 'QuickAccess';

export default QuickAccess;
