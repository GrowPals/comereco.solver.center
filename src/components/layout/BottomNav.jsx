
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
            className="bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 lg:hidden"
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
                            className="group inline-flex flex-col items-center justify-center gap-1 transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div
                                className={cn(
                                    'nav-link-base relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-transform duration-200',
                                    isItemActive ? 'nav-link-active' : 'nav-link-inactive'
                                )}
                            >
                                <ItemIcon
                                    className={cn(
                                        'nav-icon icon-lg transition-colors duration-200',
                                        isItemActive ? 'nav-icon-active' : 'group-hover:text-[var(--nav-label-active)]'
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <span
                                className={cn(
                                    'nav-label mt-1',
                                    isItemActive && 'nav-label-active'
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
                    className="group inline-flex flex-col items-center justify-center gap-1 transition-all duration-200"
                    aria-label="Ir al catálogo de productos"
                >
                    <div className="relative -mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-button transition-all duration-300 hover:shadow-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background group-active:scale-95">
                        <Plus className="h-7 w-7 text-white transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]" aria-hidden="true" />
                    </div>
                    <span className="nav-label nav-label-active mt-1 font-semibold">
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
                            className="group inline-flex flex-col items-center justify-center gap-1 transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div
                                className={cn(
                                    'nav-link-base relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-transform duration-200',
                                    isItemActive ? 'nav-link-active' : 'nav-link-inactive'
                                )}
                            >
                                <ItemIcon
                                    className={cn(
                                        'nav-icon icon-lg transition-colors duration-200',
                                        isItemActive ? 'nav-icon-active' : 'group-hover:text-[var(--nav-label-active)]'
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <span
                                className={cn(
                                    'nav-label mt-1',
                                    isItemActive && 'nav-label-active'
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
                    className="group inline-flex flex-col items-center justify-center gap-1 transition-all duration-200"
                    aria-label="Abrir menú de navegación"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <div
                        className={cn(
                            'nav-link-base relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-transform duration-200',
                            isMenuOpen ? 'nav-link-active' : 'nav-link-inactive'
                        )}
                    >
                        <Menu
                            className={cn(
                                'nav-icon icon-lg transition-colors duration-200',
                                isMenuOpen ? 'nav-icon-active' : 'group-hover:text-[var(--nav-label-active)]'
                            )}
                            aria-hidden="true"
                        />
                    </div>
                    <span
                        className={cn(
                            'nav-label mt-1',
                            isMenuOpen && 'nav-label-active'
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
