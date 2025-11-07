
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
        <Card className="dashboard-panel surface-panel">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="metric-icon flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
                        <Zap className="h-5 w-5 text-primary-600 dark:text-primary-50" aria-hidden="true" />
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
                                className="group dashboard-action surface-card flex items-center gap-4 rounded-xl border-2 border-border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                                aria-label={action.label || 'Acción rápida'}
                            >
                                <div className="metric-icon flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110">
                                    {ActionIcon && <ActionIcon className="h-6 w-6 text-primary-500 dark:text-primary-200" aria-hidden="true" />}
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
