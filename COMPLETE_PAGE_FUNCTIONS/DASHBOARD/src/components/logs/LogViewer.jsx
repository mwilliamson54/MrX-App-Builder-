import React, { useRef, useEffect } from 'react';
import { Terminal, Loader2 } from 'lucide-react';

// ============================================================================
// LOG VIEWER COMPONENT
// ============================================================================

export const LogViewer = ({ logs, isStreaming }) => {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden border border-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Build Logs</span>
          {isStreaming && <Loader2 size={14} className="text-blue-400 animate-spin" />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className={`${
            log.level === 'error' ? 'text-red-400' :
            log.level === 'warning' ? 'text-yellow-400' :
            log.level === 'success' ? 'text-green-400' :
            'text-gray-400'
          }`}>
            [{log.timestamp}] {log.message}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};