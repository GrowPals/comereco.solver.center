/**
 * Componente de imagen optimizado con lazy loading y fallback consciente del tema.
 */
import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  fallback = '/placeholder.svg',
  loading = 'lazy',
  ...props
}) => {
  let theme = null;
  try {
    theme = useTheme();
  } catch (error) {
    theme = null;
  }

  const themedFallback = useMemo(() => {
    if (fallback !== '/placeholder.svg') {
      return fallback;
    }
    return theme?.isDark ? '/placeholder-dark.svg' : '/placeholder.svg';
  }, [fallback, theme?.isDark]);

  const [imageSrc, setImageSrc] = useState(() => (src ? src : themedFallback));
  const [isLoading, setIsLoading] = useState(() => Boolean(src));
  const [isUsingFallback, setIsUsingFallback] = useState(() => !src);

  useEffect(() => {
    if (src) {
      if (imageSrc !== src) {
        setImageSrc(src);
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
      setIsUsingFallback(false);
      return;
    }

    if (imageSrc !== themedFallback) {
      setImageSrc(themedFallback);
    }
    setIsLoading(false);
    setIsUsingFallback(true);
  }, [src, themedFallback, imageSrc]);

  const handleError = useCallback(() => {
    if (isUsingFallback) {
      setIsLoading(false);
      return;
    }

    setImageSrc(themedFallback);
    setIsLoading(false);
    setIsUsingFallback(true);
  }, [isUsingFallback, themedFallback]);

  const handleLoad = useCallback((event) => {
    setIsLoading(false);

    if (!event?.currentTarget) {
      setIsUsingFallback(!src);
      return;
    }

    const current = event.currentTarget.currentSrc || event.currentTarget.src || '';
    if (!src) {
      setIsUsingFallback(true);
      return;
    }

    setIsUsingFallback(current.includes('placeholder'));
  }, [src]);

  return (
    <div className={cn('relative', className)}>
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse rounded',
            theme?.isDark
              ? 'bg-gradient-to-br from-[#1c2535]/70 via-[#161e2d]/80 to-[#0d1117]/85'
              : 'bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-100'
          )}
        />
      )}
      <img
        key={imageSrc}
        src={imageSrc}
        alt={alt}
        loading={src ? loading : 'eager'}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
