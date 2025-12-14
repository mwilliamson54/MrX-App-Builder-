import React, { useState, useEffect } from 'react';
import { useAuth, useTheme } from './hooks';
import { LoginScreen, Dashboard } from './pages';
import { API_BASE_URL } from './utils/constants';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App = () => {
  // Auth & Theme
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Login state
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Login handler
  const handleLogin = async (username, password) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        auth.login(data.token, data.user);
      } else {
        setLoginError(data.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show login screen if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        isLoading={isLoggingIn} 
        error={loginError} 
        theme={theme} 
        onThemeToggle={toggleTheme} 
      />
    );
  }

  // Main Dashboard
  return <Dashboard auth={auth} theme={theme} toggleTheme={toggleTheme} />;
};

export default App;