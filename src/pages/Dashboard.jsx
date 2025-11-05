
import React from 'react';
import { Helmet } from 'react-helmet';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import PageLoader from '@/components/PageLoader';

import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SupervisorDashboard from '@/components/dashboards/SupervisorDashboard';
import UserDashboard from '@/components/dashboards/UserDashboard';
import PageContainer from '@/components/layout/PageContainer';

const Dashboard = () => {
    const { user } = useSupabaseAuth();
    const { isAdmin, isSupervisor, isLoadingPermissions } = useUserPermissions();

    if (isLoadingPermissions || !user) {
        return <PageLoader message="Cargando tu panel..." />;
    }

    const renderDashboardByRole = () => {
        if (isAdmin) {
            return <AdminDashboard user={user} />;
        }
        if (isSupervisor) {
            return <SupervisorDashboard user={user} />;
        }
        return <UserDashboard user={user} />;
    };

    const getTitle = () => {
        if (isAdmin) return 'Panel del Administrador';
        if (isSupervisor) return 'Panel del Supervisor';
        return 'Mi Panel';
    };

    return (
        <>
            <Helmet><title>{getTitle()} - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto w-full max-w-7xl">
                    {renderDashboardByRole()}
                </div>
            </PageContainer>
        </>
    );
};

export default Dashboard;
