/**
 * DashboardSkeleton Component
 *
 * Loading skeleton para Dashboard stats
 */

import React from 'react';

export const StatCardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-1/3 rounded bg-muted/70" />
        <div className="h-10 w-10 rounded bg-muted/70" />
      </div>
      <div className="mb-2 h-8 w-1/2 rounded bg-muted/70" />
      <div className="h-3 w-2/3 rounded bg-muted/60" />
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
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-pulse">
        <div className="mb-4 h-6 w-1/4 rounded bg-muted/70" />
        <div className="h-64 rounded bg-muted/60" />
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-pulse">
        <div className="mb-4 h-6 w-1/3 rounded bg-muted/70" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted/70" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted/70" />
                <div className="h-3 w-1/2 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
