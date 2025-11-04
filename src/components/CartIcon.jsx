import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CartIcon({ variant = 'default' }) {
  const { totalItems, toggleCart } = useCart();
  const isCompact = variant === 'compact';

  return (
    <Button
      onClick={toggleCart}
      variant="ghost"
      size="icon"
      className={cn(
        'relative rounded-full transition-colors',
        isCompact && 'h-11 w-11 border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
      )}
      aria-label={totalItems > 0 ? `Abrir carrito, ${totalItems} productos` : 'Abrir carrito'}
    >
      <ShoppingCart className={cn('h-6 w-6', isCompact && 'h-5 w-5')} />
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-md',
            totalItems > 99 && 'px-1.5'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
}
