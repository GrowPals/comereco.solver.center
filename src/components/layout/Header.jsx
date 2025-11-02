
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import NotificationCenter from '@/components/layout/NotificationCenter';

const Header = ({ setSidebarOpen }) => {
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userName = user?.full_name || 'Usuario';
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b bg-white px-4 md:px-8">
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-4 lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
                <Link to="/" className="text-lg font-bold text-primary">ComerEco</Link>
            </div>
            
            {/* Search bar (Desktop) */}
            <div className="hidden lg:block relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input placeholder="Buscar requisiciones, productos..." className="pl-10" />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                <NotificationCenter />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer rounded-full p-1 hover:bg-neutral-10 transition-colors">
                            <Avatar className="h-9 w-9">
                                <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                                <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline font-semibold text-sm">{userName}</span>
                            <ChevronDown className="hidden md:inline h-4 w-4 text-neutral-500" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuItem asChild>
                            <Link to="/profile"><User className="mr-2 h-4 w-4" /> Mi Perfil</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive-subtle">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;
