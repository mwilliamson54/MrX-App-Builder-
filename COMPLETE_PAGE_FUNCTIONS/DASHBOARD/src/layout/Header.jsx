import React, { useState } from 'react';
import { Zap, Sun, Moon, Settings, Loader2, Plus, Menu, X } from 'lucide-react';
import { Badge } from '../components/ui';

// ============================================================================
// HEADER COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const Header = ({ 
  currentProject, 
  projects,
  onProjectChange, 
  onCreateProject,
  jobStatus, 
  theme, 
  onThemeToggle, 
  onLogout 
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm px-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold text-gray-100">MrX Builder</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {currentProject && projects.length > 0 && (
              <select 
                value={currentProject.id || ''}
                onChange={(e) => onProjectChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            
            <button
              onClick={onCreateProject}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              title="Create New Project"
            >
              <Plus size={20} />
            </button>
          </div>
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

      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={20} />
          <h1 className="text-lg font-bold text-gray-100">MrX</h1>
        </div>

        <div className="flex items-center gap-2">
          {jobStatus && (
            <Badge variant={jobStatus.state === 'running' ? 'info' : jobStatus.state === 'completed' ? 'success' : 'default'}>
              {jobStatus.state === 'running' && <Loader2 className="animate-spin" size={10} />}
              <span className="text-xs">{jobStatus.state}</span>
            </Badge>
          )}

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {showMobileMenu ? <X className="text-gray-400" size={20} /> : <Menu className="text-gray-400" size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-sm">
          <div className="p-4 space-y-4">
            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            {/* Project Selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Current Project</label>
              {currentProject && projects.length > 0 ? (
                <select 
                  value={currentProject.id || ''}
                  onChange={(e) => {
                    onProjectChange(e.target.value);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100"
                >
                  <option value="" disabled>Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500 text-sm">No projects available</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  onCreateProject();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 transition-colors"
              >
                <Plus size={20} />
                <span>Create New Project</span>
              </button>

              <button
                onClick={() => {
                  onThemeToggle();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg px-4 py-3 transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={20} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={20} />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    onLogout();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 transition-colors"
              >
                <Settings size={20} />
                <span>Logout</span>
              </button>
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};