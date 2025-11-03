
import React, { useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import NotificationCenter from '@/components/layout/NotificationCenter';

const Header = memo(({ setSidebarOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        await signOut();
        navigate('/login');
    }, [signOut, navigate]);

    const userName = useMemo(() => user?.full_name || 'Usuario', [user?.full_name]);
    const userInitials = useMemo(() => {
        return userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }, [userName]);

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm px-4 md:px-8" role="banner">
            {/* Mobile Logo - Sin botón hamburger */}
            <div className="flex items-center lg:hidden">
                <Link to="/dashboard" className="flex items-center gap-2" aria-label="ComerECO - Ir al inicio">
                    <img
                        src="https://i.ibb.co/2YYFKR0j/isotipo-comereco.png"
                        alt="ComerECO"
                        className="w-8 h-8 object-contain"
                        loading="eager"
                    />
                    <span className="text-lg font-bold tracking-tight">
                        <span className="text-slate-900">Comer</span>
                        <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                    </span>
                </Link>
            </div>

            {/* Search bar (Desktop) */}
            <div className="hidden lg:block relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                <Input
                    placeholder="Buscar requisiciones, productos..."
                    className="pl-12 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl h-11"
                    aria-label="Buscar en la aplicación"
                />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
                {/* Notificaciones - visible en mobile y desktop */}
                <NotificationCenter />

                {/* Menú de usuario - solo desktop */}
                <div className="hidden lg:flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                aria-label={`Menú de usuario: ${userName}`}
                                aria-haspopup="true"
                            >
                                <Avatar className="h-9 w-9 ring-2 ring-blue-100">
                                    <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">{userInitials}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-sm text-slate-900">{userName}</span>
                                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" role="menu">
                            <DropdownMenuItem asChild role="menuitem">
                                <Link to="/profile"><User className="mr-2 h-4 w-4" aria-hidden="true" /> Mi Perfil</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-error focus:text-error focus:bg-error-light"
                                role="menuitem"
                                aria-label="Cerrar sesión"
                            >
                                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
