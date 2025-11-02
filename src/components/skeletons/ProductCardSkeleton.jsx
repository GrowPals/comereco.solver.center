/**
 * ProductCardSkeleton Component
 *
 * Loading skeleton para ProductCard
 * Mantiene el mismo layout y proporciones para evitar layout shift
 */

import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col animate-pulse">
      {/* Imagen skeleton */}
      <div className="relative aspect-square bg-gray-200">
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-300" />
      </div>

      {/* Info skeleton */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
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
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
