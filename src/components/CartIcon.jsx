import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

export function CartIcon({ variant = 'default' }) {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompact = variant === 'compact';

  const handleClick = () => {
    if (location.pathname.startsWith('/cart')) {
      const fallback = location.state?.from && location.state.from !== '/cart'
        ? location.state.from
        : '/catalog';
      navigate(fallback, { replace: false });
      return;
    }

    navigate('/cart', {
      state: {
        from: location.pathname,
      },
    });
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="icon"
      className={cn(
        'relative overflow-visible rounded-full transition-colors',
        isCompact && 'h-11 w-11 border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
      )}
      aria-label={totalItems > 0 ? `Abrir carrito, ${totalItems} productos` : 'Abrir carrito'}
    >
      <ShoppingCart className={cn('h-6 w-6', isCompact && 'h-5 w-5')} />
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground leading-[20px] shadow-md',
            totalItems > 99 && 'px-2'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
}
