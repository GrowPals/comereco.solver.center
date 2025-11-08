
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getProducts } from '@/services/productService';
import { fetchRequisitions } from '@/services/requisitionService';
import { useSessionExpirationHandler } from '@/hooks/useSessionExpirationHandler';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CompanyScopeIndicator from '@/components/layout/CompanyScopeIndicator';
import PageLoader from '@/components/PageLoader';
import SkipLinks from '@/components/SkipLinks';
import AppProviders from '@/context/AppProviders';
import { ToastProvider } from '@/components/ui/toast-notification';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AlertContainer } from '@/components/AlertContainer';
import { cn } from '@/lib/utils';

// Lazy loading de las páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const RequisitionsPage = lazy(() => import('@/pages/Requisitions'));
const NewRequisitionPage = lazy(() => import('@/pages/NewRequisition'));
const RequisitionDetail = lazy(() => import('@/pages/RequisitionDetail'));
const LoginPage = lazy(() => import('@/pages/Login'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const ApprovalsPage = lazy(() => import('@/pages/Approvals'));
const UsersPage = lazy(() => import('@/pages/Users'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const CatalogPage = lazy(() => import('@/pages/Catalog'));
const NotificationsPage = lazy(() => import('@/pages/Notifications'));
const CheckoutPage = lazy(() => import('@/pages/Checkout'));
const CartPage = lazy(() => import('@/pages/Cart'));
const TemplatesPage = lazy(() => import('@/pages/Templates'));
const ProjectsPage = lazy(() => import('@/pages/Projects'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const ManageProductsPage = lazy(() => import('@/pages/admin/ManageProducts'));
const ReportsPage = lazy(() => import('@/pages/admin/Reports'));
const FavoritesPage = lazy(() => import('@/pages/Favorites'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'));
const HelpPage = lazy(() => import('@/pages/Help'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const InventoryRestockRulesPage = lazy(() => import('@/pages/InventoryRestockRules'));
const HistoryPage = lazy(() => import('@/pages/History'));


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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permissionCheck && !permissionCheck(permissions)) {
    // Si el chequeo de permisos falla, redirige al dashboard con mensaje.
    // El usuario verá el dashboard apropiado para su rol.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Componente para redirigir rutas legacy de productos
function LegacyProductRedirect() {
  const { id } = useParams();
  return <Navigate to={`/products/${id}`} replace />;
}

// Layout principal de la aplicación
const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { session } = useSupabaseAuth();

  // Hook para manejar expiración de sesión
  useSessionExpirationHandler();

  // Inicializar estado de sidebar basado en el tamaño de ventana
  useEffect(() => {
    setSidebarOpen(window.innerWidth > 1024);
  }, []);

  // Prefetching inteligente de datos probables
  useEffect(() => {
    if (!session?.user?.id) return;

    let isCancelled = false;

    // Prefetch requisiciones si está en dashboard
    if (location.pathname === '/dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['requisitions', { page: 1, pageSize: 10 }],
        queryFn: async () => {
          if (isCancelled) return { data: [], total: 0, count: 0 };
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
    if (location.pathname === '/dashboard' || location.pathname === '/catalog') {
      queryClient.prefetchQuery({
        queryKey: ['products', { page: 1, pageSize: 12, searchTerm: '', category: '' }],
        queryFn: async () => {
          if (isCancelled) return { data: [], count: 0, currentPage: 1, totalPages: 0 };
          return getProducts({ page: 1, pageSize: 12, searchTerm: '', category: '' });
        },
        staleTime: 60000, // 1 minuto
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [location.pathname, session?.user?.id, queryClient]);

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

  const pathsWithoutNav = ['/checkout', '/reset-password'];
  const pathsWithoutBottomNav = ['/cart'];
  const showNav = !pathsWithoutNav.some(path => location.pathname.startsWith(path));
  const showBottomNav = showNav && !pathsWithoutBottomNav.some(path => location.pathname.startsWith(path));

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

        {/* Floating company scope indicator */}
        {showNav && <CompanyScopeIndicator />}

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
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/requisitions" element={<RequisitionsPage />} />
                        <Route path="/requisitions/new" element={<NewRequisitionPage />} />
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
                        <Route path="/projects/:id" element={
                          <PrivateRoute>
                            <ProjectDetail />
                          </PrivateRoute>
                        } />
                        <Route path="/products/manage" element={
                          <PrivateRoute permissionCheck={(p) => p.isAdmin}>
                            <ManageProductsPage />
                          </PrivateRoute>
                        } />
                        <Route path="/inventory/restock-rules" element={
                          <PrivateRoute permissionCheck={(p) => p.canManageRestockRules}>
                            <InventoryRestockRulesPage />
                          </PrivateRoute>
                        } />
                        <Route path="/reports" element={
                          <PrivateRoute permissionCheck={(p) => p.isAdmin}>
                            <ReportsPage />
                          </PrivateRoute>
                        } />

                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/producto/:id" element={<LegacyProductRedirect />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
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
