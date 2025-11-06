/**
 * Componente de imagen optimizado con lazy loading y fallback consciente del tema.
 */
import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const KNOWN_PLACEHOLDERS = new Set([
  '/placeholder.svg',
  'placeholder.svg',
  '/placeholder-dark.svg',
  'placeholder-dark.svg',
]);

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

  const normalizedSrc = useMemo(() => {
    if (!src) return null;
    const value = String(src).trim();
    if (!value) return null;
    if (value === themedFallback || value === fallback) return null;
    if (KNOWN_PLACEHOLDERS.has(value)) return null;
    return value;
  }, [src, themedFallback, fallback]);

  const [imageSrc, setImageSrc] = useState(() => (normalizedSrc ? normalizedSrc : themedFallback));
  const [isLoading, setIsLoading] = useState(() => Boolean(normalizedSrc));
  const [isUsingFallback, setIsUsingFallback] = useState(() => !normalizedSrc);

  useEffect(() => {
    if (normalizedSrc) {
      if (imageSrc !== normalizedSrc) {
        setImageSrc(normalizedSrc);
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
  }, [normalizedSrc, themedFallback, imageSrc]);

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
      setIsUsingFallback(!normalizedSrc);
      return;
    }

    const current = event.currentTarget.currentSrc || event.currentTarget.src || '';
    if (!normalizedSrc) {
      setIsUsingFallback(true);
      return;
    }

    setIsUsingFallback(current.includes('placeholder'));
  }, [normalizedSrc]);

  const isDefaultFallback = themedFallback === '/placeholder.svg' || themedFallback === '/placeholder-dark.svg';
  const shouldRenderCustomFallback = isUsingFallback && isDefaultFallback;

  return (
    <div className={cn('relative overflow-hidden', className)}>
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
      {shouldRenderCustomFallback ? (
        <figure
          role="img"
          aria-label={alt || 'Imagen no disponible'}
          className={cn(
            'flex h-full w-full items-center justify-center border border-dashed transition-colors duration-300',
            theme?.isDark
              ? 'border-[rgba(124,188,255,0.28)] bg-[rgba(18,32,60,0.85)]'
              : 'border-blue-200/70 bg-blue-50/60'
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full shadow-sm',
              theme?.isDark
                ? 'bg-[rgba(24,46,86,0.9)] text-primary-100 shadow-[0_0_18px_rgba(88,166,255,0.35)]'
                : 'bg-white/95 text-primary-500 shadow-[0_10px_20px_rgba(59,130,246,0.14)]'
            )}
          >
            <ImageOff className="h-6 w-6" aria-hidden="true" />
          </div>
          <figcaption className="sr-only">
            {alt || 'Imagen no disponible'}
          </figcaption>
        </figure>
      ) : (
        <img
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          loading={normalizedSrc ? loading : 'eager'}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          {...props}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
