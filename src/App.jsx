
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getProducts } from '@/services/productService';
import { fetchRequisitions } from '@/services/requisitionService';
import { useSessionExpirationHandler } from '@/hooks/useSessionExpirationHandler';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import PageLoader from '@/components/PageLoader';
import SkipLinks from '@/components/SkipLinks';
import AppProviders from '@/context/AppProviders';
import { ToastProvider } from '@/components/ui/toast-notification';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AlertContainer } from '@/components/AlertContainer';
import { cn } from '@/lib/utils';
import lazyWithRetry from '@/utils/lazyWithRetry';
import { ROUTES, ROUTES_WITHOUT_NAV, ROUTES_WITHOUT_BOTTOM_NAV, getPermissionCheck } from '@/config/routes.config';

// Lazy loading de las páginas
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard'));
const RequisitionsPage = lazyWithRetry(() => import('@/pages/Requisitions'));
const NewRequisitionPage = lazyWithRetry(() => import('@/pages/NewRequisition'));
const RequisitionDetail = lazyWithRetry(() => import('@/pages/RequisitionDetail'));
const LoginPage = lazyWithRetry(() => import('@/pages/Login'));
const ProfilePage = lazyWithRetry(() => import('@/pages/Profile'));
const ApprovalsPage = lazyWithRetry(() => import('@/pages/Approvals'));
const UsersPage = lazyWithRetry(() => import('@/pages/Users'));
const SettingsPage = lazyWithRetry(() => import('@/pages/Settings'));
const CatalogPage = lazyWithRetry(() => import('@/pages/Catalog'));
const NotificationsPage = lazyWithRetry(() => import('@/pages/Notifications'));
const CheckoutPage = lazyWithRetry(() => import('@/pages/Checkout'));
const CartPage = lazyWithRetry(() => import('@/pages/Cart'));
const TemplatesPage = lazyWithRetry(() => import('@/pages/Templates'));
const ProjectsPage = lazyWithRetry(() => import('@/pages/Projects'));
const ProjectDetail = lazyWithRetry(() => import('@/pages/ProjectDetail'));
const ManageProductsPage = lazyWithRetry(() => import('@/pages/admin/ManageProducts'));
const ReportsPage = lazyWithRetry(() => import('@/pages/admin/Reports'));
const FavoritesPage = lazyWithRetry(() => import('@/pages/Favorites'));
const ResetPasswordPage = lazyWithRetry(() => import('@/pages/ResetPassword'));
const HelpPage = lazyWithRetry(() => import('@/pages/Help'));
const NotFoundPage = lazyWithRetry(() => import('@/pages/NotFound'));
const ProductDetail = lazyWithRetry(() => import('@/pages/ProductDetail'));
const InventoryRestockRulesPage = lazyWithRetry(() => import('@/pages/InventoryRestockRules'));


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
    // Guardar la ruta a la que intentó acceder para redirigir después del login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  
  if (permissionCheck && !permissionCheck(permissions)) {
    // Si el chequeo de permisos falla, redirige al dashboard con mensaje.
    // El usuario verá el dashboard apropiado para su rol.
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}

// Layout principal de la aplicación
const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { session } = useSupabaseAuth();
  
  // Hook para manejar expiración de sesión
  useSessionExpirationHandler();

  // Prefetching inteligente de datos probables
  useEffect(() => {
    if (!session) return;

    // Prefetch requisiciones si está en dashboard
    if (location.pathname === ROUTES.DASHBOARD) {
      queryClient.prefetchQuery({
        queryKey: ['requisitions', { page: 1, pageSize: 10 }],
        queryFn: async () => {
          const result = await fetchRequisitions(1, 10, 'created_at', false);
          return {
            data: result?.data ?? [],
            total: result?.total ?? 0,
            count: result?.total ?? 0,
          };
        },
        staleTime: 60000, // 1 minuto
      });
    }

    // Prefetch productos si está cerca de catalog
    if (location.pathname === ROUTES.DASHBOARD || location.pathname === ROUTES.CATALOG) {
      queryClient.prefetchQuery({
        queryKey: ['products', { page: 1, pageSize: 12, searchTerm: '', category: '' }],
        queryFn: () => getProducts({ page: 1, pageSize: 12, searchTerm: '', category: '' }),
        staleTime: 60000, // 1 minuto
      });
    }
  }, [location.pathname, session, queryClient]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileNavOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  useEffect(() => {
    const shouldLockScroll = isMobileNavOpen && typeof window !== 'undefined' && window.innerWidth < 1024;
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  const showNav = !ROUTES_WITHOUT_NAV.some(path => location.pathname.startsWith(path));
  const showBottomNav = showNav && !ROUTES_WITHOUT_BOTTOM_NAV.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <SkipLinks />

      {showNav && (
        <>
          <Sidebar isSidebarOpen={isSidebarOpen} isMobileNavOpen={isMobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              'fixed inset-0 z-40 bg-[var(--overlay-backdrop)] backdrop-blur-sm transition-opacity supports-[backdrop-filter]:backdrop-saturate-125 lg:hidden',
              isMobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            )}
          />
        </>
      )}

      <div className={cn(
        'relative min-h-screen transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'lg:pl-[18rem]' : 'lg:pl-[5rem]'
      )}>
        {showNav && <Header setSidebarOpen={handleToggleSidebar} />}

        {/* Zona de alertas globales */}
        <AlertContainer />

        <main
          className="app-main-shell relative w-full flex-1 overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] transition-all duration-300 sm:pt-[calc(env(safe-area-inset-top)+1.5rem)] lg:pb-10 lg:pt-10"
          id="main-content"
          tabIndex="-1"
          role="main"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <ErrorBoundary level="page">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
                  <PageLoader />
                </div>
              }>
                <Routes location={location}>
                        {/* Rutas principales */}
                        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                        <Route path={ROUTES.CATALOG} element={<CatalogPage />} />
                        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                        <Route path={ROUTES.HELP} element={<HelpPage />} />
                        
                        {/* Requisiciones */}
                        <Route path={ROUTES.REQUISITIONS} element={<RequisitionsPage />} />
                        <Route path={ROUTES.REQUISITIONS_NEW} element={<NewRequisitionPage />} />
                        <Route path="/requisitions/:id" element={<RequisitionDetail />} />
                        
                        {/* Productos */}
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path={ROUTES.PRODUCTS_MANAGE} element={
                          <PrivateRoute permissionCheck={getPermissionCheck(ROUTES.PRODUCTS_MANAGE)}>
                            <ManageProductsPage />
                          </PrivateRoute>
                        } />
                        
                        {/* Carrito y compra */}
                        <Route path={ROUTES.CART} element={<CartPage />} />
                        <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
                        
                        {/* Herramientas del usuario */}
                        <Route path={ROUTES.TEMPLATES} element={<TemplatesPage />} />
                        <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />
                        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                        
                        {/* Proyectos */}
                        <Route path={ROUTES.PROJECTS} element={
                          <PrivateRoute>
                            <ProjectsPage />
                          </PrivateRoute>
                        } />
                        <Route path="/projects/:id" element={
                          <PrivateRoute>
                            <ProjectDetail />
                          </PrivateRoute>
                        } />
                        
                        {/* Administración */}
                        <Route path={ROUTES.APPROVALS} element={
                          <PrivateRoute permissionCheck={getPermissionCheck(ROUTES.APPROVALS)}>
                            <ApprovalsPage />
                          </PrivateRoute>
                        } />
                        <Route path={ROUTES.USERS} element={
                          <PrivateRoute permissionCheck={getPermissionCheck(ROUTES.USERS)}>
                            <UsersPage />
                          </PrivateRoute>
                        } />
                        <Route path={ROUTES.REPORTS} element={
                          <PrivateRoute permissionCheck={getPermissionCheck(ROUTES.REPORTS)}>
                            <ReportsPage />
                          </PrivateRoute>
                        } />
                        
                        {/* Inventario */}
                        <Route path={ROUTES.INVENTORY_RESTOCK_RULES} element={
                          <PrivateRoute permissionCheck={getPermissionCheck(ROUTES.INVENTORY_RESTOCK_RULES)}>
                            <InventoryRestockRulesPage />
                          </PrivateRoute>
                        } />
                        
                        {/* Utilidades */}
                        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
                        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
          {showBottomNav && (
            <div className="mobile-nav-safe-space lg:hidden" aria-hidden="true" />
          )}
        </main>
      </div>

      {showBottomNav && (
        <div className="lg:hidden">
          <BottomNav
            isMenuOpen={isMobileNavOpen}
            onMenuClick={() => setMobileNavOpen((prev) => !prev)}
          />
        </div>
      )}
    </div>
  );
};

// Componente Raíz que ahora usa AppProviders
const App = () => (
  <Router>
    <AppProviders>
      <ToastProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-background">
            <PageLoader />
          </div>
        }>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
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
