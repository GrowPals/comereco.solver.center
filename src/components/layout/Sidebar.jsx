
import React, { useMemo, useCallback, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, FolderKanban, Users, ShoppingBag, BarChart, CheckSquare, Settings, LogOut, Star, LayoutTemplate, HelpCircle, Bell, ChevronRight, X, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';

const MenuItem = memo(({ to, icon: Icon, children, onClick, badge }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

    return (
        <NavLink to={to} onClick={onClick}>
            <div
                className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group ${
                    isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                }`}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                        isActive ? 'bg-primary-100' : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}>
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-600'}`} />
                    </div>
                    <span className="font-medium text-[15px]">{children}</span>
                </div>
                {badge && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {badge}
                    </span>
                )}
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
            </div>
        </NavLink>
    );
});

MenuItem.displayName = 'MenuItem';

const Sidebar = memo(({ isSidebarOpen, isMobileNavOpen, setMobileNavOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const { toast } = useToast();
    const { isAdmin, isSupervisor } = useUserPermissions();

    const handleLogout = useCallback(async () => {
        await signOut();
        toast({ title: 'Has cerrado sesión', variant: 'success' });
    }, [signOut, toast]);

    const handleNavClick = useCallback(() => {
        // Cerrar sidebar en mobile al hacer clic en un enlace
        setMobileNavOpen(false);
    }, [setMobileNavOpen]);

    const userName = useMemo(() => user?.full_name || 'Usuario', [user?.full_name]);
    const userEmail = useMemo(() => user?.email || '', [user?.email]);
    const primaryName = useMemo(() => userName.split(' ').filter(Boolean)[0] || userName, [userName]);
    const userInitials = useMemo(() => {
        return userName
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }, [userName]);

    // Menú - Navegación completa
    const menuSections = useMemo(() => {
        const sections = [];

        // Sección de Navegación Principal (para todos los usuarios)
        sections.push({
            title: 'Principal',
            items: [
                { to: '/dashboard', icon: Home, text: 'Dashboard' },
                { to: '/catalog', icon: ShoppingBag, text: 'Catálogo' },
                { to: '/requisitions', icon: List, text: 'Requisiciones' },
            ]
        });

        // Sección de Mis Herramientas (para todos los usuarios)
        sections.push({
            title: 'Mis Herramientas',
            items: [
                { to: '/templates', icon: LayoutTemplate, text: 'Plantillas' },
                { to: '/favorites', icon: Star, text: 'Favoritos' },
            ]
        });

        // Sección de Administración (solo para Admin y Supervisor)
        if (isAdmin || isSupervisor) {
            const adminItems = [];

            if (isAdmin) {
                adminItems.push(
                    { to: '/users', icon: Users, text: 'Gestión de Usuarios' },
                    { to: '/products/manage', icon: ShoppingBag, text: 'Gestión de Productos' },
                    { to: '/reports', icon: BarChart, text: 'Reportes y Analíticas' },
                );
            }

            if (isSupervisor || isAdmin) {
                adminItems.push(
                    { to: '/approvals', icon: CheckSquare, text: 'Aprobaciones', badge: null },
                    { to: '/projects', icon: FolderKanban, text: 'Proyectos' },
                    { to: '/inventory/restock-rules', icon: RefreshCw, text: 'Reabastecimiento' },
                );
            }

            if (adminItems.length > 0) {
                sections.push({
                    title: 'Administración',
                    items: adminItems
                });
            }
        }

        return sections;
    }, [isAdmin, isSupervisor]);

    return (
        <aside
            className={cn(
                'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-y-auto bg-white transition-transform duration-300 ease-out lg:left-0 lg:right-auto lg:overflow-visible lg:border-r lg:border-slate-200 lg:shadow-md',
                isMobileNavOpen ? 'translate-x-0 shadow-[0_20px_60px_rgba(15,23,42,0.25)]' : 'translate-x-full shadow-none',
                isSidebarOpen ? 'lg:w-72' : 'lg:w-20',
                'lg:translate-x-0'
            )}
            role="complementary"
            aria-label="Menú de navegación"
            id="navigation"
        >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] lg:hidden">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menú principal</p>
                <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 shadow-sm"
                    aria-label="Cerrar menú"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            {/* Header del Sidebar - Perfil del Usuario */}
            <div className="p-6 border-b border-slate-200">
                <NavLink to="/profile" onClick={handleNavClick}>
                    <div className="flex items-center gap-4 hover:bg-slate-50 -m-2 p-2 rounded-xl transition-colors">
                        <Avatar className="h-16 w-16 ring-2 ring-primary-100">
                            <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                            <AvatarFallback className="text-lg font-bold text-white">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-base">{primaryName}</p>
                            <p className="text-sm text-slate-500 truncate">{userEmail}</p>
                            <span className="inline-block mt-1 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                {isAdmin ? 'Administrador' : isSupervisor ? 'Supervisor' : 'Usuario'}
                            </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </div>
                </NavLink>
            </div>

            {/* Contenido del menú */}
            <nav className="flex-1 overflow-y-auto px-4 py-6" role="navigation" aria-label="Menú secundario">
                {/* Secciones específicas del rol */}
                {menuSections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <MenuItem
                                    key={item.to}
                                    to={item.to}
                                    icon={item.icon}
                                    onClick={handleNavClick}
                                    badge={item.badge}
                                >
                                    {item.text}
                                </MenuItem>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Sección de Configuración y Ayuda */}
                <div className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        General
                    </h3>
                    <div className="space-y-1">
                        <MenuItem to="/notifications" icon={Bell} onClick={handleNavClick}>
                            Notificaciones
                        </MenuItem>
                        <MenuItem to="/settings" icon={Settings} onClick={handleNavClick}>
                            Configuración
                        </MenuItem>
                        <MenuItem to="/help" icon={HelpCircle} onClick={handleNavClick}>
                            Ayuda y Soporte
                        </MenuItem>
                    </div>
                </div>
            </nav>

            {/* Footer - Cerrar Sesión */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-150 group"
                    aria-label="Cerrar sesión"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 group-hover:bg-red-100">
                            <LogOut className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="font-medium text-[15px]">Cerrar Sesión</span>
                    </div>
                </button>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
