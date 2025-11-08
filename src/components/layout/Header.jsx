
import React, { useMemo, useCallback, memo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { CartIcon } from '@/components/CartIcon';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/layout/ThemeToggle';
import CompanySwitcher from '@/components/layout/CompanySwitcher';

const MOBILE_BREAKPOINT = 1024;

const Header = memo(({ setSidebarOpen: _setSidebarOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();

    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= MOBILE_BREAKPOINT;
    });

    const handleLogout = useCallback(async () => {
        await signOut();
        navigate('/login');
    }, [signOut, navigate]);

    const userName = useMemo(() => user?.full_name || 'Usuario', [user?.full_name]);
    const userInitials = useMemo(() => {
        return userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }, [userName]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            const nextIsDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
            setIsDesktop(nextIsDesktop);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header
            className={cn(
                'nav-shell sticky top-0 z-40 w-full transition-shadow duration-base',
                'px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.55rem)] sm:px-6 sm:py-3 lg:px-10',
                'transition-colors duration-base'
            )}
            role="banner"
        >
            {isDesktop ? (
                <div className="flex w-full items-center justify-between gap-6">
                    <div className="flex flex-1 items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2 transition-opacity duration-base ease-smooth-out hover:opacity-80 active:opacity-70" aria-label="ComerECO - Ir al inicio">
                            <img
                                src="https://i.ibb.co/HLZ06zr5/isotipo-comereco-1.png"
                                alt="ComerECO"
                                className="h-10 w-10 object-contain"
                                loading="eager"
                            />
                                <span className="text-xl font-bold tracking-tight">
                                <span className="text-foreground">Comer</span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                            </span>
                        </Link>
                        <div className="flex-1">
                            <GlobalSearch />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CompanySwitcher />
                        <CartIcon />
                        <NotificationCenter />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all duration-base ease-smooth-out hover:bg-[var(--surface-muted)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background dark:hover:bg-[rgba(26,48,86,0.55)]"
                                    aria-label={`Menú de usuario: ${userName}`}
                                    aria-haspopup="true"
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                        <AvatarFallback className="text-sm font-semibold text-white">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold text-foreground">{userName}</span>
                                    <ChevronDown className="icon-sm text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" role="menu">
                                <DropdownMenuItem asChild role="menuitem">
                                    <Link to="/profile"><User className="mr-2 icon-sm" aria-hidden="true" /> Mi Perfil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-error focus:bg-error-light focus:text-error"
                                    role="menuitem"
                                    aria-label="Cerrar sesión"
                                >
                                    <LogOut className="mr-2 icon-sm" aria-hidden="true" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ThemeToggle className="ml-1" />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <GlobalSearch variant="mobile" />
                    </div>
                    <CompanySwitcher variant="icon" />
                    <NotificationCenter variant="icon" />
                    <CartIcon variant="compact" />
                    <ThemeToggle />
                </div>
            )}
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
