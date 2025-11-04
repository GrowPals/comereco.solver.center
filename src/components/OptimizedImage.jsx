/**
 * Componente de imagen optimizado con lazy loading y error handling
 */
import React, { useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  fallback = '/placeholder.svg',
  loading = 'lazy',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const handleError = useCallback(() => {
    // Si aún no hemos intentado el fallback, usarlo
    if (!fallbackAttempted && imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(true);
      setFallbackAttempted(true);
    }
    setIsLoading(false);
  }, [imageSrc, fallback, fallbackAttempted]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    // Solo limpiar el error si no estamos mostrando el fallback
    if (!fallbackAttempted) {
      setHasError(false);
    }
  }, [fallbackAttempted]);

  return (
    <div className={cn('relative', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

