import React from 'react';
import { Building2 } from 'lucide-react';

const PageLoader = ({ message }) => {
  return (
    <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(66,84,112,0.5)] bg-[rgba(18,25,41,0.9)] shadow-[0_20px_45px_rgba(5,10,24,0.35)]">
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(66,165,255,0.25),transparent_70%)] animate-pulse" aria-hidden="true" />
        <Building2 className="relative h-10 w-10 text-info animate-pulse" aria-hidden="true" />
      </div>
      {message && (
        <p className="text-base font-medium text-muted-foreground/90">{message}</p>
      )}
    </div>
  );
};

export default PageLoader;
