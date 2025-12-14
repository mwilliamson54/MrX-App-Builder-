import React from 'react';
import { Code, Copy } from 'lucide-react';

// ============================================================================
// CODE VIEWER COMPONENT
// ============================================================================

export const CodeViewer = ({ code, language = 'kotlin' }) => {
  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">{language}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-200">
          <Copy size={16} />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};