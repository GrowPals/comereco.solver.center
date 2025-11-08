/**
 * Hook para detectar el tamaño del viewport de manera optimizada
 *
 * Este hook evita tener múltiples event listeners de resize en cada componente,
 * lo cual puede causar problemas de performance.
 *
 * @returns {Object} Objeto con el ancho del viewport y función helper
 */

import { useState, useEffect } from 'react';

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

function useViewport() {
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return TABLET_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timeoutId = null;

    // Throttle usando setTimeout para mejor performance
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setViewportWidth(window.innerWidth);
      }, 100); // Throttle de 100ms
    };

    // Agregar listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    width: viewportWidth,
    isMobile: viewportWidth < MOBILE_BREAKPOINT,
    isTablet: viewportWidth >= MOBILE_BREAKPOINT && viewportWidth < TABLET_BREAKPOINT,
    isDesktop: viewportWidth >= TABLET_BREAKPOINT,
  };
}

export default useViewport;
