
import React from 'react';
import { Helmet } from 'react-helmet';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import PageLoader from '@/components/PageLoader';

import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SupervisorDashboard from '@/components/dashboards/SupervisorDashboard';
import UserDashboard from '@/components/dashboards/UserDashboard';

const Dashboard = () => {
    const { user } = useSupabaseAuth();
    const { isAdmin, isSupervisor, isLoadingPermissions } = useUserPermissions();

    if (isLoadingPermissions || !user) {
        return <PageLoader message="Cargando tu dashboard..." />;
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
        if (isAdmin) return 'Dashboard de Administrador';
        if (isSupervisor) return 'Dashboard de Supervisor';
        return 'Mi Dashboard';
    };

    return (
        <>
            <Helmet><title>{getTitle()} - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                {renderDashboardByRole()}
            </div>
        </>
    );
};

export default Dashboard;
