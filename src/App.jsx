
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Cart from '@/components/Cart';
import PageLoader from '@/components/PageLoader';
import AppProviders from '@/context/AppProviders';
import { ToastProvider } from '@/components/ui/toast-notification';

// Lazy loading de las páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const RequisitionsPage = lazy(() => import('@/pages/Requisitions'));
const RequisitionDetail = lazy(() => import('@/pages/RequisitionDetail'));
const LoginPage = lazy(() => import('@/pages/Login'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const ApprovalsPage = lazy(() => import('@/pages/Approvals'));
const UsersPage = lazy(() => import('@/pages/Users'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const CatalogPage = lazy(() => import('@/pages/Catalog'));
const NotificationsPage = lazy(() => import('@/pages/Notifications'));
const CheckoutPage = lazy(() => import('@/pages/Checkout'));
const TemplatesPage = lazy(() => import('@/pages/Templates'));
const ProjectsPage = lazy(() => import('@/pages/Projects'));
const ManageProductsPage = lazy(() => import('@/pages/admin/ManageProducts'));
const ReportsPage = lazy(() => import('@/pages/admin/Reports'));
const FavoritesPage = lazy(() => import('@/pages/Favorites'));


// Componente para rutas privadas
function PrivateRoute({ children, permissionCheck }) {
  const { session, loading } = useSupabaseAuth();
  const permissions = useUserPermissions();
  const location = useLocation();

  if (loading || permissions.isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <PageLoader />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (permissionCheck && !permissionCheck(permissions)) {
    // Si el chequeo de permisos falla, redirige al dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Layout principal de la aplicación
const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(() => window.innerWidth > 1024);
  const [isMobileNavOpen, setMobileNavOpen] = React.useState(false);
  const location = useLocation();

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileNavOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  const pathsWithoutNav = ['/checkout'];
  const showNav = !pathsWithoutNav.some(path => location.pathname.startsWith(path));

  const contentMargin = isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20';

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {showNav && (
        <>
          <Sidebar isSidebarOpen={isSidebarOpen} isMobileNavOpen={isMobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
          {isMobileNavOpen && <div onClick={() => setMobileNavOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />}
        </>
      )}
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${contentMargin}`}>
        {showNav && <Header setSidebarOpen={handleToggleSidebar} />}
        
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0" id="main-content">
            <Suspense fallback={<div className="h-full"><PageLoader /></div>}>
                <Routes location={location}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/requisitions" element={<RequisitionsPage />} />
                        <Route path="/requisitions/:id" element={<RequisitionDetail />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        
                        <Route path="/approvals" element={
                          <PrivateRoute permissionCheck={(p) => p.canApproveRequisitions}>
                            <ApprovalsPage />
                          </PrivateRoute>
                        } />
                        <Route path="/users" element={
                          <PrivateRoute permissionCheck={(p) => p.canManageUsers}>
                            <UsersPage />
                          </PrivateRoute>
                        } />
                        <Route path="/projects" element={
                          <PrivateRoute>
                            <ProjectsPage />
                          </PrivateRoute>
                        } />
                         <Route path="/products/manage" element={
                          <PrivateRoute permissionCheck={(p) => p.isAdmin}>
                            <ManageProductsPage />
                          </PrivateRoute>
                        } />
                        <Route path="/reports" element={
                          <PrivateRoute permissionCheck={(p) => p.isAdmin}>
                            <ReportsPage />
                          </PrivateRoute>
                        } />

                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
            </Suspense>
        </main>

        {showNav && (
            <>
                <div className="lg:hidden">
                    <BottomNav />
                </div>
                <Cart />
            </>
        )}
      </div>
    </div>
  );
};

// Componente Raíz que ahora usa AppProviders
const App = () => (
  <Router>
    <AppProviders>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AppProviders>
  </Router>
);

export default App;
