/**
 * ProductCardSkeleton Component
 *
 * Loading skeleton para ProductCard
 * Mantiene el mismo layout y proporciones para evitar layout shift
 */

import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="flex w-[88vw] max-w-[22rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card animate-pulse sm:w-full sm:max-w-none">
      <div className="relative aspect-video w-full bg-muted" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted/70" />
          <div className="h-4 w-3/4 rounded bg-muted/70" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted/70" />
          <div className="h-6 w-32 rounded bg-muted/70" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted/70" />
            <div className="h-6 w-24 rounded bg-muted/70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-11 w-11 rounded-xl bg-muted/70" />
            <div className="h-11 w-24 rounded-xl bg-muted/70" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

/**
 * Componente helper para renderizar múltiples skeletons
 */
export const ProductCardSkeletonList = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 justify-items-start gap-4 sm:justify-items-center md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
