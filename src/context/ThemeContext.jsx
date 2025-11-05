import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'theme';
const ThemeContext = createContext(null);

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue === 'light' || storedValue === 'dark' ? storedValue : null;
  } catch (error) {
    return null;
  }
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  return mediaQuery?.matches ? 'dark' : 'light';
};

const applyDocumentTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [hasExplicitPreference, setHasExplicitPreference] = useState(() => getStoredTheme() !== null);
  const [theme, setThemeState] = useState(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    applyDocumentTheme(theme);

    if (!hasExplicitPreference || typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // Storage not available, ignore persistence silently
    }
  }, [theme, hasExplicitPreference]);

  useEffect(() => {
    if (typeof window === 'undefined' || hasExplicitPreference) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [hasExplicitPreference]);

  const setTheme = useCallback((nextTheme, { persist = true } = {}) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(normalizedTheme);
    setHasExplicitPreference(Boolean(persist));

    if (!persist && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        // ignore storage errors on cleanup
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setHasExplicitPreference(true);
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, setTheme, toggleTheme]);

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
