
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
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <Zap className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Acceso Rápido</CardTitle>
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
                                className="group flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                aria-label={action.label || 'Acción rápida'}
                            >
                                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:scale-110 transition-transform duration-200">
                                    {ActionIcon && <ActionIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
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
