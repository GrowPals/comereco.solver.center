
import React, { useMemo, useCallback, memo, useEffect, useState, useRef } from 'react';
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
const SCROLL_THRESHOLD = 10; // Píxeles mínimos de scroll para activar hide/show

const Header = memo(({ setSidebarOpen: _setSidebarOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();

    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= MOBILE_BREAKPOINT;
    });

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    const handleLogout = useCallback(async () => {
        await signOut();
        navigate('/login');
    }, [signOut, navigate]);

    const userName = useMemo(() => user?.full_name || 'Usuario', [user?.full_name]);
    const userInitials = useMemo(() => {
        return (userName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }, [userName]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            const nextIsDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
            setIsDesktop(nextIsDesktop);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Efecto para manejar scroll en mobile
    useEffect(() => {
        if (typeof window === 'undefined' || isDesktop) return;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    // Si está en el top, siempre mostrar
                    if (currentScrollY < 10) {
                        setIsHeaderVisible(true);
                    }
                    // Si scrollea hacia abajo y ha superado el threshold, ocultar
                    else if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > SCROLL_THRESHOLD) {
                        setIsHeaderVisible(false);
                    }
                    // Si scrollea hacia arriba, mostrar
                    else if (currentScrollY < lastScrollY.current && lastScrollY.current - currentScrollY > SCROLL_THRESHOLD) {
                        setIsHeaderVisible(true);
                    }

                    lastScrollY.current = currentScrollY;
                    ticking.current = false;
                });

                ticking.current = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDesktop]);

    return (
        <header
            className={cn(
                'nav-shell sticky top-0 z-40 w-full transition-all duration-base ease-smooth-out',
                'px-4 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.35rem)] sm:px-6 sm:py-3 lg:px-10',
                !isDesktop && !isHeaderVisible && '-translate-y-full opacity-0',
                !isDesktop && isHeaderVisible && 'translate-y-0 opacity-100'
            )}
            role="banner"
        >
            {isDesktop ? (
                <div className="flex w-full items-center justify-between gap-6">
                    <div className="flex flex-1 items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2 transition-opacity duration-base ease-smooth-out hover:opacity-80 active:opacity-70" aria-label="ComerECO - Ir al inicio">
                            <img
                                src="/logo.png"
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
