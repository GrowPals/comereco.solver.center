
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const QuickAccess = ({ actions }) => {
    const navigate = useNavigate();

    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((action, index) => (
                         <Button 
                            key={index}
                            variant={action.variant || 'outline'}
                            className="flex flex-col h-24 justify-center items-center text-center p-2"
                            onClick={() => navigate(action.path)}
                        >
                            <action.icon className="h-6 w-6 mb-2" />
                            <span className="text-xs font-semibold">{action.label}</span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default QuickAccess;
