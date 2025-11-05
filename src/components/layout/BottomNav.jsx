
import React, { useMemo, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Menu, Layers, Plus } from 'lucide-react';

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
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden" role="navigation" aria-label="Navegación móvil principal">
            <div className="mx-auto grid h-[72px] grid-cols-5 max-w-full px-2 pb-[env(safe-area-inset-bottom)]">
                {/* Navegación izquierda */}
                {navItemsLeft.map((item) => {
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

                {/* Botón de acción rápida - Catálogo */}
                <button
                    onClick={() => navigate('/catalog')}
                    className="inline-flex flex-col items-center justify-center group transition-all duration-200"
                    aria-label="Ir al catálogo de productos"
                >
                    <div className="relative -mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl transition-all duration-300 hover:shadow-2xl group-active:scale-95">
                        <Plus className="h-7 w-7 text-white transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-blue-600 transition-colors duration-200">
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
                    aria-expanded={isMenuOpen}
                >
                    <div className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all duration-200 ${
                        isMenuOpen ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}>
                        <Menu className={`w-6 h-6 transition-colors duration-200 ${
                            isMenuOpen ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'
                        }`} aria-hidden="true" />
                    </div>
                    <span className={`text-[10px] font-semibold mt-1 transition-colors duration-200 ${
                        isMenuOpen ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                        Menú
                    </span>
                </button>
            </div>
        </nav>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
