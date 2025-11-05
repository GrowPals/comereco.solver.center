
import React, { useMemo, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Menu, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = memo(({ onMenuClick, isMenuOpen = false }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItemsLeft = useMemo(() => [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/templates', icon: Layers, label: 'Plantillas' },
    ], []);

    const navItemsRight = useMemo(() => [
        { path: '/requisitions', icon: ClipboardList, label: 'Pedidos' },
    ], []);

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-[0_-8px_24px_rgba(15,23,42,0.08)] transition-colors duration-200 dark:border-border dark:bg-[#121929]/95 dark:shadow-[0_-16px_36px_rgba(5,10,24,0.45)] lg:hidden"
            role="navigation"
            aria-label="Navegación móvil principal"
        >
            <div className="mx-auto grid h-[72px] grid-cols-5 max-w-full px-2 pb-[env(safe-area-inset-bottom)]">
                {/* Navegación izquierda */}
                {navItemsLeft.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = isActive(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="group inline-flex flex-col items-center justify-center transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div
                                className={cn(
                                    'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl transition-all duration-200',
                                    isItemActive
                                        ? 'bg-primary/15'
                                        : 'hover:bg-muted/70 dark:hover:bg-muted/40'
                                )}
                            >
                                <ItemIcon
                                    className={cn(
                                        'h-6 w-6 transition-colors duration-200',
                                        isItemActive
                                            ? 'text-primary-600 dark:text-primary-200'
                                            : 'text-muted-foreground group-hover:text-foreground'
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <span
                                className={cn(
                                    'mt-1 text-[10px] font-semibold transition-colors duration-200',
                                    isItemActive
                                        ? 'text-primary-600 dark:text-primary-200'
                                        : 'text-muted-foreground group-hover:text-foreground'
                                )}
                            >
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Botón de acción rápida - Catálogo */}
                <button
                    onClick={() => navigate('/catalog')}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label="Ir al catálogo de productos"
                >
                    <div className="relative -mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl transition-all duration-300 hover:shadow-2xl group-active:scale-95">
                        <Plus className="h-7 w-7 text-white transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-primary-600 transition-colors duration-200 dark:text-primary-200">
                        Agregar
                    </span>
                </button>

                {/* Navegación derecha */}
                {navItemsRight.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = isActive(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="group inline-flex flex-col items-center justify-center transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div
                                className={cn(
                                    'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl transition-all duration-200',
                                    isItemActive
                                        ? 'bg-primary/15'
                                        : 'hover:bg-muted/70 dark:hover:bg-muted/40'
                                )}
                            >
                                <ItemIcon
                                    className={cn(
                                        'h-6 w-6 transition-colors duration-200',
                                        isItemActive
                                            ? 'text-primary-600 dark:text-primary-200'
                                            : 'text-muted-foreground group-hover:text-foreground'
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <span
                                className={cn(
                                    'mt-1 text-[10px] font-semibold transition-colors duration-200',
                                    isItemActive
                                        ? 'text-primary-600 dark:text-primary-200'
                                        : 'text-muted-foreground group-hover:text-foreground'
                                )}
                            >
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Botón de Menú - Abre el Sidebar */}
                <button
                    onClick={onMenuClick}
                    className="group inline-flex flex-col items-center justify-center transition-all duration-200"
                    aria-label="Abrir menú de navegación"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <div
                        className={cn(
                            'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl transition-all duration-200',
                            isMenuOpen
                                ? 'bg-primary/15'
                                : 'hover:bg-muted/70 dark:hover:bg-muted/40'
                        )}
                    >
                        <Menu
                            className={cn(
                                'h-6 w-6 transition-colors duration-200',
                                isMenuOpen
                                    ? 'text-primary-600 dark:text-primary-200'
                                    : 'text-muted-foreground group-hover:text-foreground'
                            )}
                            aria-hidden="true"
                        />
                    </div>
                    <span
                        className={cn(
                            'mt-1 text-[10px] font-semibold transition-colors duration-200',
                            isMenuOpen
                                ? 'text-primary-600 dark:text-primary-200'
                                : 'text-muted-foreground group-hover:text-foreground'
                        )}
                    >
                        Menú
                    </span>
                </button>
            </div>
        </nav>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
