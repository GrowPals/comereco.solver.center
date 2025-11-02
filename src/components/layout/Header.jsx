
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
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-neutral-200 bg-white/95 backdrop-blur-sm shadow-sm px-4 md:px-8" role="banner">
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-4 lg:hidden">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSidebarOpen(true)}
                    className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="Abrir menú de navegación"
                >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
                <Link to="/" className="text-lg font-bold" aria-label="ComerECO - Ir al inicio">
                    <span className="text-neutral-900">Comer</span>
                    <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                </Link>
            </div>

            {/* Search bar (Desktop) */}
            <div className="hidden lg:block relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
                <Input 
                    placeholder="Buscar requisiciones, productos..." 
                    className="pl-12 bg-neutral-50/50 border-neutral-200 focus-visible:bg-white"
                    aria-label="Buscar en la aplicación"
                />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
                <NotificationCenter />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 hover:bg-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            aria-label={`Menú de usuario: ${userName}`}
                            aria-haspopup="true"
                        >
                            <Avatar className="h-9 w-9 ring-2 ring-primary-100">
                                <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                <AvatarFallback className="bg-gradient-primary text-white font-semibold">{userInitials}</AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline font-semibold text-sm text-neutral-900">{userName}</span>
                            <ChevronDown className="hidden md:inline h-4 w-4 text-neutral-500" aria-hidden="true" />
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
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
