
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, FolderKanban, ShoppingCart, CheckSquare, Users, LayoutGrid, Star, BarChart, LayoutTemplate } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCart } from '@/hooks/useCart';

const BottomNav = () => {
    const location = useLocation();
    const { isAdmin, isSupervisor, canCreateRequisitions } = useUserPermissions();
    const { cart } = useCart();

    const getNavItems = () => {
        const baseItems = [
            { path: '/dashboard', icon: Home, label: 'Inicio' },
            { path: '/catalog', icon: LayoutGrid, label: 'Catálogo' },
        ];

        if (isAdmin) {
            return [
                ...baseItems,
                { path: '/requisitions', icon: List, label: 'Reqs' },
                { path: '/projects', icon: FolderKanban, label: 'Proyectos' },
                { path: '/users', icon: Users, label: 'Usuarios' },
            ];
        }

        if (isSupervisor) {
            return [
                ...baseItems,
                { path: '/approvals', icon: CheckSquare, label: 'Aprobar' },
                { path: '/projects', icon: FolderKanban, label: 'Proyectos' },
                { path: '/requisitions', icon: List, label: 'Mis Reqs' },
            ];
        }

        // User role
        return [
            ...baseItems,
            { path: '/requisitions', icon: List, label: 'Mis Reqs' },
            { path: '/templates', icon: LayoutTemplate, label: 'Plantillas' },
            { path: '/favorites', icon: Star, label: 'Favoritos' },
        ];
    };

    const navItems = getNavItems();
    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
            <div className="grid h-16 grid-cols-5 max-w-full mx-auto">
                {navItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive: isLinkActive }) =>
                            `inline-flex flex-col items-center justify-center px-2 group transition-colors duration-200 ${isLinkActive || isActive(item.path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`
                        }
                    >
                        <div className="relative">
                            <item.icon className="w-6 h-6 mb-1" />
                            {item.path === '/catalog' && cart.length > 0 && (
                                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                    {cart.length}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
