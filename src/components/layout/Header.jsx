
import React, { useMemo, useCallback, memo, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Search, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { CartIcon } from '@/components/CartIcon';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { cn } from '@/lib/utils';

const MOBILE_BREAKPOINT = 1024;

const Header = memo(({ setSidebarOpen: _setSidebarOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();

    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= MOBILE_BREAKPOINT;
    });
    const [showMobileBar, setShowMobileBar] = useState(true);
    const lastScrollY = useRef(0);

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
            if (nextIsDesktop) {
                setShowMobileBar(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || isDesktop) {
            return undefined;
        }

        const handleScroll = () => {
            const current = window.scrollY;

            if (current < 24) {
                setShowMobileBar(true);
                lastScrollY.current = current;
                return;
            }

            if (current > lastScrollY.current + 12) {
                setShowMobileBar(false);
            } else if (current < lastScrollY.current - 12) {
                setShowMobileBar(true);
            }

            lastScrollY.current = current;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDesktop]);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 w-full transition-transform duration-300 ease-out',
                isDesktop
                    ? 'border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-6 lg:px-10'
                    : 'border-b border-transparent bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-md'
            )}
            role="banner"
            style={!isDesktop ? { transform: showMobileBar ? 'translateY(0)' : 'translateY(-110%)' } : undefined}
        >
            {isDesktop ? (
                <div className="flex w-full items-center justify-between gap-6">
                    <div className="flex flex-1 items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2" aria-label="ComerECO - Ir al inicio">
                            <img
                                src="https://i.ibb.co/2YYFKR0j/isotipo-comereco.png"
                                alt="ComerECO"
                                className="h-10 w-10 object-contain"
                                loading="eager"
                            />
                            <span className="text-xl font-bold tracking-tight">
                                <span className="text-slate-900">Comer</span>
                                <span className="bg-gradient-primary bg-clip-text text-transparent">ECO</span>
                            </span>
                        </Link>
                        <div className="flex-1">
                            <GlobalSearch />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CartIcon />
                        <NotificationCenter />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                    aria-label={`Menú de usuario: ${userName}`}
                                    aria-haspopup="true"
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                        <AvatarFallback className="text-sm font-semibold text-white">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold text-slate-900">{userName}</span>
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
                                    className="text-error focus:bg-error-light focus:text-error"
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
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <GlobalSearch variant="mobile" />
                    </div>
                    <NotificationCenter variant="icon" />
                    <CartIcon variant="compact" />
                </div>
            )}
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
