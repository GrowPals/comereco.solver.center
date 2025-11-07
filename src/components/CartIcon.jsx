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
        'relative overflow-visible rounded-full transition-colors shadow-none hover:shadow-none active:shadow-none',
        isCompact && 'h-11 w-11 border border-border bg-[var(--surface-contrast)] text-foreground hover:bg-[var(--surface-muted)] dark:border-[#1a2f4f] dark:bg-[rgba(12,26,52,0.72)] dark:text-primary-50 dark:hover:bg-[rgba(16,32,62,0.85)] dark:hover:border-[#4678d4] dark:shadow-[0_22px_48px_rgba(5,12,28,0.52)] dark:hover:shadow-[0_28px_60px_rgba(6,14,30,0.6)]'
      )}
      aria-label={totalItems > 0 ? `Abrir carrito, ${totalItems} productos` : 'Abrir carrito'}
    >
      <ShoppingCart className={cn('h-6 w-6', isCompact && 'h-5 w-5')} />
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground leading-tight',
            'shadow-none dark:shadow-[0_20px_48px_rgba(4,12,28,0.55)]',
            totalItems > 99 && 'px-2'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
}
