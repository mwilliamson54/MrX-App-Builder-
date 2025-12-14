import React from 'react';
import { Zap, Sun, Moon, Settings, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui';

// ============================================================================
// HEADER COMPONENT
// ============================================================================

export const Header = ({ currentProject, onProjectChange, jobStatus, theme, onThemeToggle, onLogout }) => {
  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold text-gray-100">MrX Builder</h1>
        </div>
        
        {currentProject && (
          <select 
            value={currentProject.id}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={currentProject.id}>{currentProject.name}</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-4">
        {jobStatus && (
          <Badge variant={jobStatus.state === 'running' ? 'info' : jobStatus.state === 'completed' ? 'success' : 'default'}>
            {jobStatus.state === 'running' && <Loader2 className="animate-spin" size={12} />}
            {jobStatus.state}
          </Badge>
        )}
        
        <button 
          onClick={onThemeToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="text-gray-400" size={20} /> : <Moon className="text-gray-400" size={20} />}
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              onLogout();
            }
          }}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          title="Logout"
        >
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400">Connected</span>
        </div>
      </div>
    </header>
  );
};