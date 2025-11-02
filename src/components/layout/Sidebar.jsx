
import React, { useMemo, useCallback, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, FolderKanban, Users, ShoppingBag, BarChart, CheckSquare, Settings, LogOut, Star, LayoutTemplate } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/useToast';

const NavItem = memo(({ to, icon: Icon, children, isSidebarOpen }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

    return (
        <NavLink to={to}>
            {({ isPending }) => (
                <div
                    className={`flex items-center p-3 my-1 rounded-xl transition-all duration-200 relative group focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 ${
                        isActive
                            ? 'bg-gradient-primary text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    role="listitem"
                >
                    <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 group-hover:scale-110'}`} aria-hidden="true" />
                    <span className={`ml-4 font-semibold text-sm ${isSidebarOpen ? 'block' : 'hidden'}`}>
                        {children}
                    </span>
                    {isPending && <span className="ml-2" aria-label="Cargando">...</span>}
                </div>
            )}
        </NavLink>
    );
});

NavItem.displayName = 'NavItem';

const Sidebar = memo(({ isSidebarOpen, isMobileNavOpen, setMobileNavOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const { toast } = useToast();
    const { isAdmin, isSupervisor } = useUserPermissions();
    
    const handleLogout = useCallback(async () => {
        await signOut();
        toast({ title: 'Has cerrado sesión', variant: 'success' });
    }, [signOut, toast]);

    const navItems = useMemo(() => {
        let items = [
            { to: '/dashboard', icon: Home, text: 'Dashboard' },
            { to: '/catalog', icon: ShoppingBag, text: 'Catálogo' },
            { to: '/requisitions', icon: List, text: 'Requisiciones' },
        ];

        if (isAdmin) {
            items.push(
                { to: '/users', icon: Users, text: 'Usuarios' },
                { to: '/projects', icon: FolderKanban, text: 'Proyectos' },
                { to: '/products/manage', icon: ShoppingBag, text: 'Productos' },
                { to: '/reports', icon: BarChart, text: 'Reportes' }
            );
        } else if (isSupervisor) {
            items.push(
                { to: '/approvals', icon: CheckSquare, text: 'Aprobaciones' },
                { to: '/projects', icon: FolderKanban, text: 'Proyectos' }
            );
        } else { // User role
            items.push(
                { to: '/templates', icon: LayoutTemplate, text: 'Plantillas' },
                { to: '/favorites', icon: Star, text: 'Favoritos' }
            );
        }

        return items;
    }, [isAdmin, isSupervisor]);

    return (
        <aside
            className={`fixed lg:relative top-0 left-0 h-full bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-200 shadow-lg lg:shadow-none ${isSidebarOpen ? 'w-64' : 'w-20'} ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            role="complementary"
            aria-label="Navegación principal"
            id="navigation"
        >
            <div className={`flex items-center ${isSidebarOpen ? 'justify-start px-6' : 'justify-center'} h-20 border-b border-slate-200`}>
                <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm ${isSidebarOpen ? 'h-12 w-12' : 'h-12 w-12'}`}>
                    <img
                        src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                        alt="ComerECO Logo"
                        className={`object-contain ${isSidebarOpen ? 'h-7 w-7' : 'h-7 w-7'}`}
                    />
                </div>
                {isSidebarOpen && (
                    <span className="ml-3 text-xl font-bold text-slate-900 tracking-tight">
                        Comer<span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                    </span>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 overflow-y-auto" role="navigation" aria-label="Menú principal">
                {navItems.map(item => <NavItem key={item.to} to={item.to} icon={item.icon} isSidebarOpen={isSidebarOpen}>{item.text}</NavItem>)}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200">
                <NavItem to="/settings" icon={Settings} isSidebarOpen={isSidebarOpen}>Configuración</NavItem>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 my-1 rounded-lg cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Cerrar sesión"
                >
                    <LogOut className="h-5 w-5 text-gray-500 group-hover:text-red-600" aria-hidden="true" />
                    <span className={`ml-4 font-medium text-sm ${isSidebarOpen ? 'block' : 'hidden'}`}>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
