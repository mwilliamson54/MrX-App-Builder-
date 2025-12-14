import { useState, useCallback } from 'react';

// ============================================================================
// AUTH HOOK
// ============================================================================

export const useAuth = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem('sessionToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('sessionToken'));
  const [user, setUser] = useState(() => {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  });

  const login = useCallback((newToken, userData) => {
    sessionStorage.setItem('sessionToken', newToken);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { token, isAuthenticated, user, login, logout };
};