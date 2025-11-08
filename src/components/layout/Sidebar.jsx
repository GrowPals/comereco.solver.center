
import React, { useMemo, useCallback, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, FolderKanban, Users, ShoppingBag, BarChart, CheckSquare, Settings, LogOut, Star, LayoutTemplate, HelpCircle, Bell, ChevronRight, X, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MenuItem = memo(({ to, icon: Icon, children, onClick, badge }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

    const handleClick = (e) => {
        // Ejecutar el callback de cierre del menú móvil
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <NavLink to={to} onClick={handleClick}>
            <div
                className={cn(
                    'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-base ease-smooth-out',
                    'font-medium text-sm cursor-pointer',
                    isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
            >
                {/* Icon */}
                <Icon
                    className={cn(
                        'w-5 h-5 flex-shrink-0 transition-colors duration-base ease-smooth-out',
                        isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                    )}
                />

                {/* Label */}
                <span className="flex-1">{children}</span>

                {/* Badge */}
                {badge && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                        {badge}
                    </span>
                )}
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
                    'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-y-auto transition-transform duration-300 ease-out lg:left-0 lg:right-auto lg:overflow-visible',
                    'bg-card border-r border-border transition-colors duration-200',
                    isMobileNavOpen ? 'translate-x-0' : 'translate-x-full',
                    isSidebarOpen ? 'lg:w-72' : 'lg:w-20',
                    'lg:translate-x-0'
                )}
                role="complementary"
                aria-label="Menú de navegación"
                id="navigation"
                tabIndex="-1"
            >
                {/* Header mobile del sidebar */}
                <div className="flex items-center justify-between border-b border-border px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] transition-colors lg:hidden">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Menú principal</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileNavOpen(false)}
                        className="h-10 w-10 rounded-xl"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Header del Sidebar - Perfil del Usuario */}
                <div className="border-b border-border p-6 transition-colors">
                    <NavLink to="/profile" onClick={handleNavClick}>
                        <div className="-m-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-muted">
                            <Avatar className="h-16 w-16">
                                <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                <AvatarFallback className="text-lg font-bold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-bold text-foreground truncate" title={primaryName}>{primaryName}</p>
                                <p className="truncate text-sm text-muted-foreground" title={userEmail}>{userEmail}</p>
                                <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                    {isAdmin ? 'Administrador' : isSupervisor ? 'Supervisor' : 'Usuario'}
                                </span>
                            </div>
                            <ChevronRight className="w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
                <div className="border-t border-border p-4 transition-colors">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 rounded-xl px-4 py-3 h-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>
            </aside>
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
