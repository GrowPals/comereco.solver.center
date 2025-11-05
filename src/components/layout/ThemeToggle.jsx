import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  const iconClassName = 'h-5 w-5 transition-transform duration-200';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/70 text-foreground transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      aria-pressed={isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <Sun
        className={cn(
          iconClassName,
          'absolute text-amber-400 transition-opacity duration-200',
          isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
        )}
        aria-hidden={isDark}
      />
      <Moon
        className={cn(
          iconClassName,
          'absolute text-slate-200 transition-opacity duration-200',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
        )}
        aria-hidden={!isDark}
      />
      <span className="sr-only">Tema actual: {theme === 'dark' ? 'oscuro' : 'claro'}</span>
    </button>
  );
};

export default ThemeToggle;
