/**
 * ProductCardSkeleton Component
 *
 * Loading skeleton para ProductCard
 * Mantiene el mismo layout y proporciones para evitar layout shift
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductCardSkeleton = () => {
  return (
    <div className="flex w-[88vw] max-w-[22rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card sm:w-full sm:max-w-none">
      <Skeleton className="relative aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-11 w-24 rounded-xl" />
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
