
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'; // CAMBIO CLAVE
import { LayoutDashboard, FileText, CheckSquare, ShoppingBag, History } from 'lucide-react';
import { motion } from 'framer-motion';

// CAMBIO CLAVE: Roles actualizados a los de Supabase
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', roles: ['employee', 'admin_corp', 'super_admin'] },
  { to: '/catalog', icon: ShoppingBag, label: 'Catálogo', roles: ['employee', 'admin_corp', 'super_admin'] },
  { to: '/requisitions', icon: FileText, label: 'Pedidos', roles: ['employee', 'admin_corp', 'super_admin'] },
  { to: '/approvals', icon: CheckSquare, label: 'Aprobar', roles: ['admin_corp', 'super_admin'] },
  { to: '/history', icon: History, label: 'Historial', roles: ['employee', 'admin_corp', 'super_admin'] },
];

const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <NavLink
      to={to}
      className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-all duration-200 w-full relative"
    >
      <Icon className={cn("w-6 h-6 transition-colors", isActive ? 'text-primary' : 'text-neutral-400')} />
      <span className={cn("text-xs font-semibold transition-colors", isActive ? 'text-primary' : 'text-neutral-400')}>
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="bottom-nav-active-indicator"
          className="absolute -bottom-[17px] h-1 w-10 bg-neutral-900 rounded-full"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </NavLink>
  );
};

const BottomNav = () => {
  const { user } = useSupabaseAuth(); // CAMBIO CLAVE
  const location = useLocation();

  if (!user) {
    return null; // No mostrar nada si el usuario no está cargado
  }

  // CAMBIO CLAVE: Usamos user.role y los nuevos roles
  const filteredNavItems = navItems.filter(item => user.role && item.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-card/80 backdrop-blur-lg border-t shadow-top z-40 lg:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-2 pt-1">
        {filteredNavItems.slice(0, 5).map(item => (
          <NavItem key={item.to} {...item} isActive={location.pathname.startsWith(item.to)} />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
