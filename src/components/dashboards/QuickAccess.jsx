
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { SectionIcon, StatIcon } from '@/components/ui/icon-wrapper';

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
                    <SectionIcon icon={Zap} />
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
                                {ActionIcon && (
                                    <StatIcon
                                        icon={ActionIcon}
                                        size="sm"
                                        tone="primary"
                                        glow={false}
                                        className="shrink-0"
                                    />
                                )}
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
