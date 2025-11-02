import React from 'react';
import { Building2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-background">
      <div className="animate-pulse">
        <Building2 className="h-16 w-16 text-primary" />
      </div>
    </div>
  );
};

export default PageLoader;