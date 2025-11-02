
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const QuickAccess = ({ actions }) => {
    const navigate = useNavigate();

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((action, index) => (
                         <Button
                            key={index}
                            variant={action.variant || 'outline'}
                            className="flex flex-col h-28 justify-center items-center text-center p-4 gap-3"
                            onClick={() => navigate(action.path)}
                        >
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                                <action.icon className="h-5 w-5 text-primary-600" />
                            </div>
                            <span className="text-sm font-semibold leading-tight">{action.label}</span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default QuickAccess;
