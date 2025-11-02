
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, FolderKanban, Users, ShoppingBag, BarChart, CheckSquare, Settings, LogOut, Star, LayoutTemplate } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/useToast';

const NavItem = ({ to, icon: Icon, children, isSidebarOpen }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

    return (
        <NavLink to={to}>
            {({ isPending }) => (
                <div className={`flex items-center p-3 my-1 rounded-lg transition-all duration-200 relative group ${
                    isActive
                        ? 'bg-gradient-primary text-white shadow-md'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-primary-600'} transition-colors`} />
                    <span className={`ml-4 font-medium text-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        {children}
                    </span>
                    {isPending && <span className="ml-2 animate-pulse">...</span>}
                </div>
            )}
        </NavLink>
    );
};

const Sidebar = ({ isSidebarOpen, isMobileNavOpen, setMobileNavOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const { toast } = useToast();
    const { isAdmin, isSupervisor } = useUserPermissions();
    
    const handleLogout = async () => {
        await signOut();
        toast({ title: 'Has cerrado sesión', variant: 'success' });
    };

    const getNavItems = () => {
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
    };

    const navItems = getNavItems();

    return (
        <aside className={`fixed lg:relative top-0 left-0 h-full bg-card border-r border-border z-50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className={`flex items-center ${isSidebarOpen ? 'justify-start px-6' : 'justify-center'} h-20 border-b`}>
                 <img
                    src="https://i.ibb.co/XZW8Nh3v/solver-logo-1.png"
                    alt="ComerECO Logo"
                    className={`h-10 w-10 object-contain transition-all duration-300 ${isSidebarOpen ? '' : 'h-8 w-8'}`}
                />
                {isSidebarOpen && <span className="ml-3 text-xl font-bold">Comer<span className="text-primary">ECO</span></span>}
            </div>

            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                {navItems.map(item => <NavItem key={item.to} to={item.to} icon={item.icon} isSidebarOpen={isSidebarOpen}>{item.text}</NavItem>)}
            </nav>

            <div className="px-4 py-4 border-t">
                <NavItem to="/settings" icon={Settings} isSidebarOpen={isSidebarOpen}>Configuración</NavItem>
                <div onClick={handleLogout} className="flex items-center p-3 my-1 rounded-lg cursor-pointer text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200">
                    <LogOut className="h-6 w-6" />
                    <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Cerrar Sesión</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
