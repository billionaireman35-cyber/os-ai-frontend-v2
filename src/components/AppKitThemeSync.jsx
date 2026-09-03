import { useEffect } from 'react';
import { useAppKitTheme } from '@reown/appkit/react';
import { useTheme } from '../context/ThemeContext';

// Keeps the WalletConnect/AppKit modal's theme in sync with the app's own
// dark/light toggle - AppKit manages its own separate theme state, so
// without this it always falls back to its init-time default regardless
// of what the user actually has the app set to.
export function AppKitThemeSync() {
  const { setThemeMode } = useAppKitTheme();
  const { theme } = useTheme();

  useEffect(() => {
    setThemeMode(theme === 'dark' ? 'dark' : 'light');
  }, [theme, setThemeMode]);

  return null;
}
