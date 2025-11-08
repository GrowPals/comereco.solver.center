/**
 * DashboardSkeleton Component
 *
 * Loading skeleton para Dashboard stats
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
      </div>
      <Skeleton className="mb-2 h-8 w-1/2 rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Chart area */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <Skeleton className="mb-4 h-6 w-1/4 rounded" />
        <Skeleton className="h-64 rounded" />
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <Skeleton className="mb-4 h-6 w-1/3 rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
