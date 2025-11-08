import React, { useState, useEffect, memo } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SCROLL_THRESHOLD = 300; // Píxeles de scroll antes de mostrar el botón

const ScrollToTopButton = memo(({ className }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const toggleVisibility = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Check initial state

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'h-12 w-12 rounded-full',
        'bg-gradient-to-br from-primary-500 to-primary-600',
        'text-white shadow-button',
        'transition-all duration-300 hover:shadow-button-hover',
        'active:scale-95',
        'lg:hidden', // Solo en mobile
        'bottom-24 right-4', // Posicionado encima del BottomNav
        'animate-in fade-in slide-in-from-bottom-4',
        className
      )}
      aria-label="Volver arriba"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';

export default ScrollToTopButton;
