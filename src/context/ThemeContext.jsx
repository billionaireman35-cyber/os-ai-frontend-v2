import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'os-ai-theme';
const VALID_THEMES = ['system', 'light', 'dark'];

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialPreference() {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (VALID_THEMES.includes(stored)) {
    return stored;
  }

  // Backward compatibility with the previous two-option theme system.
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return 'system';
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(getInitialPreference);

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const effectiveTheme =
    themePreference === 'system'
      ? systemTheme
      : themePreference;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    // Keep the app synchronized with the device OS theme.
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(THEME_STORAGE_KEY, themePreference);

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;
  }, [themePreference, effectiveTheme]);

  const setTheme = (nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemePreference(nextTheme);
  };

  // Preserves the existing toggle behavior:
  // dark -> light -> dark.
  // System mode remains available explicitly through Settings.
  const toggleTheme = () => {
    setThemePreference((current) => {
      if (current === 'dark') return 'light';
      if (current === 'light') return 'dark';

      return systemTheme === 'dark' ? 'light' : 'dark';
    });
  };

  const value = useMemo(
    () => ({
      // `theme` remains the effective light/dark theme so existing
      // components depending on theme === 'dark' continue to work.
      theme: effectiveTheme,

      // User's actual preference: system, light, or dark.
      themePreference,

      // Current OS/device theme.
      systemTheme,

      // Effective theme after resolving System.
      effectiveTheme,

      setTheme,
      toggleTheme,
    }),
    [
      effectiveTheme,
      systemTheme,
      themePreference,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
