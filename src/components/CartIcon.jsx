import React, { useEffect, useState, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

export function CartIcon({ variant = 'default' }) {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompact = variant === 'compact';
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevItemsRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = totalItems;
  }, [totalItems]);

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
    <button
      onClick={handleClick}
      className={cn(
        'header-action-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        !isCompact && 'border-0 shadow-none'
      )}
      aria-label={totalItems > 0 ? `Abrir carrito, ${totalItems} productos` : 'Abrir carrito'}
    >
      <ShoppingCart className={cn(
        'h-5 w-5 transition-transform',
        shouldAnimate && 'animate-[wiggle_0.3s_ease-in-out]'
      )} />
      {totalItems > 0 && (
        <span
          className={cn(
            'header-badge',
            shouldAnimate && 'animate-[badgePulse_0.4s_ease-in-out]'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
