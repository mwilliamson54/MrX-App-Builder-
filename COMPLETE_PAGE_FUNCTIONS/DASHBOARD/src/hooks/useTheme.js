import { useState, useCallback } from 'react';

// ============================================================================
// THEME HOOK
// ============================================================================

export const useTheme = () => {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('theme') || 'dark'
  );

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme };
};