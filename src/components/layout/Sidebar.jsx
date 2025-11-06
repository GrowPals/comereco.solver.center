
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
                className={cn(
                    'group flex items-center justify-between rounded-xl p-3.5 transition-all duration-200',
                    isActive
                        ? 'text-primary-600 shadow-sm dark:text-primary-200 dark:shadow-[0_12px_30px_rgba(18,41,70,0.45)]'
                        : 'text-foreground/75 hover:bg-[var(--surface-muted)] active:bg-primary/10 dark:text-muted-foreground dark:hover:bg-[rgba(26,50,88,0.65)] dark:active:bg-[rgba(34,72,130,0.65)]'
                )}
            >
                <div className="flex flex-1 items-center gap-3">
                <div
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                        isActive
                                ? 'bg-gradient-to-b from-[rgba(66,165,255,0.25)] to-[rgba(66,165,255,0.05)] text-primary-600 ring-2 ring-primary/30 dark:bg-[rgba(80,150,255,0.18)] dark:text-primary-50 dark:ring-[rgba(110,190,255,0.28)]'
                                : 'bg-[var(--surface-contrast)] text-foreground/65 shadow-sm ring-1 ring-border/70 group-hover:text-foreground group-hover:ring-primary-200/50 dark:bg-[rgba(20,38,68,0.55)] dark:text-muted-foreground dark:ring-[rgba(32,64,110,0.65)] dark:group-hover:bg-[rgba(26,50,88,0.75)] dark:group-hover:text-primary-50 dark:group-hover:ring-[rgba(110,190,255,0.35)]'
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                    <span className="text-[15px] font-medium text-foreground">{children}</span>
                </div>
                {badge && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                        {badge}
                    </span>
                )}
                <ChevronRight
                    className={cn(
                        'h-4 w-4 transition-transform',
                        isActive ? 'text-primary-500 dark:text-primary-200' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                />
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
                { to: '/dashboard', icon: Home, text: 'Inicio' },
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
        <>
            <button
                type="button"
                className="mobile-nav-overlay lg:hidden"
                data-open={isMobileNavOpen}
                aria-hidden={!isMobileNavOpen}
                aria-label="Cerrar menú de navegación"
                tabIndex={isMobileNavOpen ? 0 : -1}
                onClick={() => setMobileNavOpen(false)}
            />
            <aside
                className={cn(
                    'sidebar-shell fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-y-auto transition-transform duration-300 ease-out lg:left-0 lg:right-auto lg:overflow-visible lg:shadow-none',
                    'transition-colors duration-200',
                    isMobileNavOpen ? 'translate-x-0' : 'translate-x-full',
                    isSidebarOpen ? 'lg:w-72' : 'lg:w-20',
                    'lg:translate-x-0'
                )}
                role="complementary"
                aria-label="Menú de navegación"
                id="navigation"
            >
            <div className="flex items-center justify-between border-b border-border px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] transition-colors lg:hidden dark:border-border">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Menú principal</p>
                <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 shadow-none hover:shadow-none active:shadow-none dark:border-border dark:text-muted-foreground dark:hover:bg-muted/40 dark:shadow-[0_20px_46px_rgba(5,12,28,0.5)]"
                    aria-label="Cerrar menú"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            {/* Header del Sidebar - Perfil del Usuario */}
            <div className="border-b border-border p-6 transition-colors dark:border-border">
                <NavLink to="/profile" onClick={handleNavClick}>
                    <div className="-m-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-[var(--surface-muted)] dark:hover:bg-muted/40">
                        <Avatar className="h-16 w-16 ring-2 ring-primary/30 dark:ring-primary/40">
                            <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                            <AvatarFallback className="text-lg font-bold text-white">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-bold text-foreground">{primaryName}</p>
                            <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
                            <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary/20 dark:text-primary-100">
                                {isAdmin ? 'Administrador' : isSupervisor ? 'Supervisor' : 'Usuario'}
                            </span>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </div>
                </NavLink>
            </div>

            {/* Contenido del menú */}
            <nav className="flex-1 overflow-y-auto px-4 py-6" role="navigation" aria-label="Menú secundario">
                {/* Secciones específicas del rol */}
                {menuSections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
            <div className="border-t border-border p-4 transition-colors dark:border-border">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center justify-between rounded-xl p-3.5 text-destructive transition-colors duration-150 hover:bg-destructive/10 active:bg-destructive/20"
                    aria-label="Cerrar sesión"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 transition-colors group-hover:bg-destructive/20">
                            <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="font-medium text-[15px]">Cerrar Sesión</span>
                    </div>
                </button>
            </div>
            </aside>
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
