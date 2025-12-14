import React, { useState } from 'react';
import { Zap, Sun, Moon, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui';

// ============================================================================
// LOGIN SCREEN COMPONENT
// ============================================================================

export const LoginScreen = ({ onLogin, isLoading, error, theme, onThemeToggle }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
      <div className="absolute top-4 right-4">
        <button 
          onClick={onThemeToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="text-gray-400" size={20} /> : <Moon className="text-gray-400" size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md px-6">
        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border p-8`}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <Zap className="text-blue-500" size={32} />
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              MrX Builder
            </h1>
          </div>

          <div className="text-center mb-6">
            <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              Welcome Back
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              Default credentials: MrX / MrX@786
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};