import React from 'react';
import { Building2 } from 'lucide-react';

const PageLoader = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="relative">
        <div className="absolute inset-0 animate-ping">
          <div className="h-20 w-20 rounded-2xl bg-blue-200 opacity-75" />
        </div>
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-lg">
          <Building2 className="h-10 w-10 text-blue-600 animate-pulse" aria-hidden="true" />
        </div>
      </div>
      {message && (
        <p className="mt-6 text-base font-medium text-slate-600 animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default PageLoader;