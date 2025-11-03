/**
 * ProductCardSkeleton Component
 *
 * Loading skeleton para ProductCard
 * Mantiene el mismo layout y proporciones para evitar layout shift
 */

import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 h-full flex flex-col animate-pulse">
      {/* Layout Mobile: Horizontal */}
      <div className="md:hidden flex flex-row gap-3 p-3">
        {/* Imagen skeleton - 16:9 */}
        <div className="relative w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0">
          <div className="absolute top-1 left-1 w-12 h-4 bg-gray-300 rounded" />
        </div>

        {/* Info skeleton - Mobile */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Layout Desktop: Vertical */}
      <div className="hidden md:flex md:flex-col h-full">
        {/* Imagen skeleton */}
        <div className="relative aspect-square bg-gray-200">
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-300" />
          <div className="absolute bottom-3 left-3 w-20 h-6 bg-gray-300 rounded-lg" />
        </div>

        {/* Info skeleton */}
        <div className="p-5 space-y-3 flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-12" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
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
    <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
