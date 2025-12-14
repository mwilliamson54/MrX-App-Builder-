import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../components/ui';
import { FileTreeItem } from '../components/file-explorer';
import { LogViewer } from '../components/logs';
import { ArtifactList } from '../components/artifacts';

// ============================================================================
// RIGHT PANEL COMPONENT
// ============================================================================

export const RightPanel = ({ activeTab, fileTree, selectedFile, logs, artifacts, onFileSelect, isCollapsed }) => {
  const [currentTab, setCurrentTab] = useState(activeTab || 'files');

  if (isCollapsed) return null;

  return (
    <aside className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col">
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