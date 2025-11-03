
import React, { useMemo, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, List, Menu } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const BottomNav = memo(({ onMenuClick }) => {
    const location = useLocation();
    const { totalItems, toggleCart } = useCart();

    // BottomNav simplificado - SOLO acciones principales y frecuentes
    const navItems = useMemo(() => [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/catalog', icon: ShoppingCart, label: 'Catálogo' },
    ], []);

    const navItemsRight = useMemo(() => [
        { path: '/requisitions', icon: List, label: 'Mis Reqs' },
    ], []);

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" role="navigation" aria-label="Navegación móvil principal">
            <div className="grid h-20 grid-cols-5 max-w-full mx-auto px-2 safe-area-inset-bottom">
                {/* Navegación izquierda */}
                {navItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = isActive(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 ${
                                isItemActive
                                    ? 'bg-blue-50'
                                    : 'hover:bg-slate-50'
                            }`}>
                                <ItemIcon className={`transition-colors duration-200 ${
                                    isItemActive
                                        ? 'w-6 h-6 text-blue-600'
                                        : 'w-6 h-6 text-slate-500 group-hover:text-slate-900'
                                }`} aria-hidden="true" />
                            </div>
                            <span className={`text-[10px] font-semibold mt-1 transition-colors duration-200 ${
                                isItemActive
                                    ? 'text-blue-600'
                                    : 'text-slate-500 group-hover:text-slate-900'
                            }`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Botón de Carrito - CENTRO - Destacado */}
                <button
                    onClick={toggleCart}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label={`Abrir carrito de compras${totalItems > 0 ? ` (${totalItems} productos)` : ''}`}
                >
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 -mt-2">
                        <ShoppingCart className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white ring-2 ring-white shadow-md animate-pulse" aria-label={`${totalItems} productos en el carrito`}>
                                {totalItems > 9 ? '9+' : totalItems}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold mt-1 text-blue-600 transition-colors duration-200">
                        Carrito
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
                            className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                            aria-label={item.label}
                            aria-current={isItemActive ? 'page' : undefined}
                        >
                            <div className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 ${
                                isItemActive
                                    ? 'bg-blue-50'
                                    : 'hover:bg-slate-50'
                            }`}>
                                <ItemIcon className={`transition-colors duration-200 ${
                                    isItemActive
                                        ? 'w-6 h-6 text-blue-600'
                                        : 'w-6 h-6 text-slate-500 group-hover:text-slate-900'
                                }`} aria-hidden="true" />
                            </div>
                            <span className={`text-[10px] font-semibold mt-1 transition-colors duration-200 ${
                                isItemActive
                                    ? 'text-blue-600'
                                    : 'text-slate-500 group-hover:text-slate-900'
                            }`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Botón de Menú - Abre el Sidebar */}
                <button
                    onClick={onMenuClick}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label="Abrir menú de navegación"
                    aria-haspopup="true"
                >
                    <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 hover:bg-slate-50">
                        <Menu className="w-6 h-6 text-slate-500 group-hover:text-slate-900 transition-colors duration-200" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-semibold mt-1 text-slate-500 group-hover:text-slate-900 transition-colors duration-200">
                        Menú
                    </span>
                </button>
            </div>
        </nav>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
