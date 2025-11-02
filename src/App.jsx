
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/context/CartContext';
import { useCart } from '@/hooks/useCart';
import { RequisitionProvider } from '@/context/RequisitionContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import FAB from '@/components/FAB';
import Cart from '@/components/Cart';
import { Toaster } from '@/components/ui/toaster';
import PageLoader from '@/components/PageLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/customSupabaseClient';
import { useToast } from './components/ui/use-toast.js';

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
const HistoryPage = lazy(() => import('@/pages/History'));
const TemplatesPage = lazy(() => import('@/pages/Templates'));
const NewRequisitionPage = lazy(() => import('@/pages/NewRequisition'));

function PrivateRoute({ children, requiredRoles }) {
  const { session, loading, user } = useSupabaseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <PageLoader />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRoles && user && !requiredRoles.some(role => user.role === role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { refetch: refetchCart } = useCart();

  useEffect(() => {
    if (!user) return;

    const companyChannel = supabase.channel(`company:${user.company_id}`);

    companyChannel
      .on('broadcast', { event: 'cart_updated' }, (payload) => {
        console.log('Cart update received!', payload);
        toast({
          title: 'Carrito Actualizado',
          description: 'Otro miembro del equipo ha actualizado el carrito.',
        });
        refetchCart();
      })
      .on('broadcast', { event: 'requisition_updated' }, (payload) => {
        console.log('Requisition update received!', payload);
        toast({
          title: 'Requisiciones Actualizadas',
          description: `La requisición #${payload.internal_folio} ha sido actualizada.`,
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to company channel: company:${user.company_id}`);
        }
      });

    return () => {
      supabase.removeChannel(companyChannel);
    };
  }, [user, toast, refetchCart]);


  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileNavOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  const pathsWithoutNav = ['/checkout', '/requisitions/new'];
  const showNav = !pathsWithoutNav.some(path => location.pathname.startsWith(path));

  const contentMargin = isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20';

  return (
    <div className="flex h-screen bg-background text-foreground">
      {showNav && (
        <>
          <Sidebar isSidebarOpen={isSidebarOpen} isMobileNavOpen={isMobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
          {isMobileNavOpen && <div onClick={() => setMobileNavOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />}
        </>
      )}
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${contentMargin}`}>
        {showNav && <Header isSidebarOpen={isSidebarOpen} setSidebarOpen={handleToggleSidebar} />}
        
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0" id="main-content">
            <Suspense fallback={<div className="h-full"><PageLoader /></div>}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/requisitions" element={<RequisitionsPage />} />
                        <Route path="/requisitions/new" element={<NewRequisitionPage />} />
                        <Route path="/requisitions/:id" element={<RequisitionDetail />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/approvals" element={<PrivateRoute requiredRoles={['admin_corp', 'super_admin']}><ApprovalsPage /></PrivateRoute>} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/users" element={<PrivateRoute requiredRoles={['admin_corp', 'super_admin']}><UsersPage /></PrivateRoute>} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </AnimatePresence>
            </Suspense>
        </main>

        {showNav && (
            <>
                <div className="lg:hidden">
                    <BottomNav />
                    <FAB />
                </div>
            </>
        )}
      </div>
    </div>
  );
};

const Root = () => {
    return (
        <ThemeProvider>
            <SupabaseAuthProvider>
                <CartProvider>
                    <RequisitionProvider>
                        <FavoritesProvider>
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
                            <Cart />
                            <Toaster />
                        </FavoritesProvider>
                    </RequisitionProvider>
                </CartProvider>
            </SupabaseAuthProvider>
        </ThemeProvider>
    );
}


const App = () => (
  <Router>
    <Root />
  </Router>
);

export default App;
