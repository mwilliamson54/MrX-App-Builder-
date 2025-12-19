import React, { useState } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { Input } from '../ui';
import { FileTreeItem } from '../components/file-explorer';
import { LogViewer } from '../components/logs';
import { ArtifactList } from '../components/artifacts';

// ============================================================================
// RIGHT PANEL COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const RightPanel = ({ activeTab, fileTree, selectedFile, logs, artifacts, onFileSelect, isCollapsed }) => {
  const [currentTab, setCurrentTab] = useState(activeTab || 'files');
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Desktop Panel
  const DesktopPanel = () => {
    if (isCollapsed) return null;

    return (
      <aside className="hidden lg:flex w-96 border-l border-gray-800 bg-gray-900 flex-col">
        <div className="flex border-b border-gray-800">
          {['files', 'logs', 'artifacts'].map(tab => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                currentTab === tab 
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {currentTab === 'files' && (
            <div>
              <div className="mb-4">
                <Input placeholder="Search files..." icon={Search} size="sm" />
              </div>
              {fileTree ? (
                <div className="space-y-1">
                  {fileTree.map((item, idx) => (
                    <FileTreeItem key={idx} item={item} onSelect={onFileSelect} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Loading file tree...</p>
              )}
            </div>
          )}

          {currentTab === 'logs' && (
            <LogViewer logs={logs || []} isStreaming={false} />
          )}

          {currentTab === 'artifacts' && (
            <ArtifactList artifacts={artifacts} />
          )}
        </div>
      </aside>
    );
  };

  // Mobile Floating Button & Panel
  const MobilePanel = () => (
    <>
      {/* Floating Files Button */}
      <button
        onClick={() => setShowMobilePanel(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all"
      >
        <FileText size={24} />
      </button>

      {/* Mobile Panel Overlay */}
      {showMobilePanel && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">Project Files</h3>
              <button
                onClick={() => setShowMobilePanel(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              {['files', 'logs', 'artifacts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    currentTab === tab 
                      ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {currentTab === 'files' && (
                <div>
                  <div className="mb-4">
                    <Input placeholder="Search files..." icon={Search} />
                  </div>
                  {fileTree ? (
                    <div className="space-y-1">
                      {fileTree.map((item, idx) => (
                        <FileTreeItem 
                          key={idx} 
                          item={item} 
                          onSelect={(path) => {
                            onFileSelect(path);
                            setShowMobilePanel(false);
                          }} 
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Loading file tree...</p>
                  )}
                </div>
              )}

              {currentTab === 'logs' && (
                <div className="h-full">
                  <LogViewer logs={logs || []} isStreaming={false} />
                </div>
              )}

              {currentTab === 'artifacts' && (
                <ArtifactList artifacts={artifacts} />
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );

  return (
    <>
      <DesktopPanel />
      <MobilePanel />
    </>
  );
};