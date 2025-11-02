/**
 * Componente de imagen optimizado con lazy loading y error handling
 */
import React, { useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

const OptimizedImage = memo(({ 
  src, 
  alt = '', 
  className = '', 
  fallback = '/placeholder.png',
  loading = 'lazy',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(true);
    }
    setIsLoading(false);
  }, [imageSrc, fallback]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

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

