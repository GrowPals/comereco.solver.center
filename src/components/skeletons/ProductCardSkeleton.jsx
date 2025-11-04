/**
 * ProductCardSkeleton Component
 *
 * Loading skeleton para ProductCard
 * Mantiene el mismo layout y proporciones para evitar layout shift
 */

import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse">
      <div className="relative w-full bg-slate-100 aspect-[4/5]">
        <div className="absolute left-4 top-4 h-6 w-20 rounded-full bg-slate-200" />
        <div className="absolute right-4 top-4 h-9 w-9 rounded-full bg-slate-200" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-3/4 rounded bg-slate-200" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="h-6 w-24 rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="h-10 w-20 rounded-full bg-slate-200" />
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
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
