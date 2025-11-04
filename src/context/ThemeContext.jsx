import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const applyLightTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
    } catch (error) {
      // noop: storage may not be available
    }
  }, []);

  useEffect(() => {
    applyLightTheme();
  }, [applyLightTheme]);

  const toggleTheme = useCallback(() => {
    applyLightTheme();
  }, [applyLightTheme]);

  const value = useMemo(() => ({
    theme: 'light',
    toggleTheme,
    isDark: false,
  }), [toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

