import React, { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const PageLoader = ({ message }) => {
  let theme = null;
  try {
    theme = useTheme();
  } catch (error) {
    theme = { isDark: false };
  }

  const { wrapperClasses, haloClasses, iconClasses } = useMemo(() => {
    if (theme?.isDark) {
      return {
        wrapperClasses: 'border-[rgba(66,84,112,0.5)] bg-[rgba(18,25,41,0.9)] shadow-[0_20px_45px_rgba(5,10,24,0.35)]',
        haloClasses: 'bg-[radial-gradient(circle_at_center,rgba(66,165,255,0.25),transparent_70%)]',
        iconClasses: 'text-info',
      };
    }

    return {
      wrapperClasses: 'border-slate-200/80 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]',
      haloClasses: 'bg-[radial-gradient(circle_at_center,rgba(56,132,255,0.18),rgba(56,132,255,0.04)_72%)]',
      iconClasses: 'text-primary-500',
    };
  }, [theme?.isDark]);

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-4">
      <div
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-3xl border transition-colors duration-300',
          wrapperClasses
        )}
      >
        <div
          className={cn(
            'absolute inset-0 rounded-3xl animate-pulse transition-colors duration-300',
            haloClasses
          )}
          aria-hidden="true"
        />
        <Building2
          className={cn('relative h-10 w-10 animate-pulse transition-colors duration-300', iconClasses)}
          aria-hidden="true"
        />
      </div>
      {message && (
        <p className="text-base font-medium text-muted-foreground/90">{message}</p>
      )}
    </div>
  );
};

export default PageLoader;
