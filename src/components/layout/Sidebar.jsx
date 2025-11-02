
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, List, BarChart2, ChevronDown, Users, Settings, ClipboardCheck, X, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const navItems = [
  { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard', roles: ['employee', 'admin_corp', 'super_admin'] },
  { name: 'Requisiciones', icon: FileText, path: '/requisitions', roles: ['employee', 'admin_corp', 'super_admin'] },
  { name: 'Aprobaciones', icon: ClipboardCheck, path: '/approvals', roles: ['admin_corp', 'super_admin'] },
  { name: 'Catálogo', icon: ShoppingCart, path: '/catalog', roles: ['employee', 'admin_corp', 'super_admin'] },
  { name: 'Historial', icon: BarChart2, path: '/history', roles: ['employee', 'admin_corp', 'super_admin'] },
  { name: 'Plantillas', icon: List, path: '/templates', roles: ['employee', 'admin_corp', 'super_admin'] },
  { name: 'Usuarios', icon: Users, path: '/users', roles: ['admin_corp', 'super_admin'] },
  { name: 'Configuración', icon: Settings, path: '/settings', roles: ['employee', 'admin_corp', 'super_admin'] },
];

const Sidebar = ({ isSidebarOpen, isMobileNavOpen, setMobileNavOpen }) => {
  const { user, signOut } = useSupabaseAuth();

  const handleLogout = async () => {
    await signOut();
    // The redirect will be handled by the PrivateRoute component
  };

  const userName = user?.full_name || 'Usuario';
  const userRole = user?.role || 'invitado';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden',
          isMobileNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-background border-r transform transition-transform duration-300',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:z-30',
          isSidebarOpen ? 'lg:w-64' : 'lg:w-20'
        )}
      >
        <div className={cn("flex items-center justify-between h-20 px-4 border-b")}>
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <ShoppingCart className="w-8 h-8 text-primary flex-shrink-0" />
            <span className={cn("text-xl font-bold whitespace-nowrap transition-opacity", isSidebarOpen ? "opacity-100" : "lg:opacity-0")}>
              ComerEco
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                  !isSidebarOpen && 'justify-center'
                )
              }
              onClick={() => isMobileNavOpen && setMobileNavOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn('whitespace-nowrap', !isSidebarOpen && 'lg:hidden')}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t p-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <div className={cn("w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted", !isSidebarOpen && "justify-center")}>
                 <Avatar className="h-9 w-9">
                    <AvatarImage alt={`Avatar de ${userName}`} src={user?.avatar_url} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className={cn("flex-1 overflow-hidden", !isSidebarOpen && "lg:hidden")}>
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{userRole.replace('_', ' ')}</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground", !isSidebarOpen && "lg:hidden")} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
                <DropdownMenuItem asChild><Link to="/profile"><Users className="mr-2 h-4 w-4" /> Mi Perfil</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
