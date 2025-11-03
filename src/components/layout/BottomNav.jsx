
import React, { useMemo, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Plus, List, Menu } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCart } from '@/hooks/useCart';

const BottomNav = memo(({ onMenuClick }) => {
    const location = useLocation();
    const { totalItems, toggleCart } = useCart();

    // BottomNav simplificado - SOLO acciones principales y frecuentes
    // Igual para todos los roles (siguiendo patrón de apps populares)
    const navItems = useMemo(() => [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/catalog', icon: ShoppingCart, label: 'Catálogo' },
        { path: '/requisitions', icon: List, label: 'Mis Reqs' },
    ], []);

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid h-20 grid-cols-5 max-w-full mx-auto px-2 safe-area-inset-bottom">
                {navItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = isActive(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                        >
                            <div className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 ${
                                isItemActive
                                    ? 'bg-primary-50'
                                    : 'hover:bg-slate-50'
                            }`}>
                                <ItemIcon className={`transition-colors duration-200 ${
                                    isItemActive
                                        ? 'w-6 h-6 text-primary-600'
                                        : 'w-6 h-6 text-slate-500 group-hover:text-slate-900'
                                }`} />
                            </div>
                            <span className={`text-[10px] font-semibold mt-1 transition-colors duration-200 ${
                                isItemActive
                                    ? 'text-primary-600'
                                    : 'text-slate-500 group-hover:text-slate-900'
                            }`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Botón de Carrito - Abre el carrito lateral */}
                <button
                    onClick={toggleCart}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label="Abrir carrito"
                >
                    <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 bg-gradient-primary shadow-lg hover:shadow-xl scale-110">
                        <Plus className="w-6 h-6 text-white transition-colors duration-200" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                                {totalItems > 9 ? '9+' : totalItems}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-semibold mt-1 text-primary-600 transition-colors duration-200">
                        Carrito
                    </span>
                </button>

                {/* Botón de Menú - Abre el Sidebar */}
                <button
                    onClick={onMenuClick}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label="Abrir menú"
                >
                    <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 hover:bg-slate-50">
                        <Menu className="w-6 h-6 text-slate-500 group-hover:text-slate-900 transition-colors duration-200" />
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
