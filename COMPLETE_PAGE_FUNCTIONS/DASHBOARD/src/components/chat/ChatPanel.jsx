import React, { useRef, useEffect } from 'react';
import { MessageSquare, Play, Code, FileText } from 'lucide-react';
import { Button } from '../ui';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

// ============================================================================
// CHAT PANEL (CENTER PANEL) COMPONENT
// ============================================================================

export const ChatPanel = ({ messages, onSendMessage, isLoading, hasActiveChat, hasProject }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasProject) {
    return (
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 max-w-md px-6">
            <MessageSquare size={64} className="mb-4 opacity-20 mx-auto" />
            <p className="text-lg mb-2">No Project Selected</p>
            <p className="text-sm mb-4">Create a new project to get started with MrX Builder</p>
            <p className="text-xs text-gray-600">Click the + button in the header to create your first project</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasActiveChat) {
    return (
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MessageSquare size={64} className="mb-4 opacity-20 mx-auto" />
            <p className="text-lg mb-2">No chat selected</p>
            <p className="text-sm">Create a new chat to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm">Ask me to build features, fix bugs, or analyze code</p>
          </div>
        ) : (
          messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 p-4 bg-gray-900">
        <div className="flex gap-2 mb-4">
          <Button size="sm" variant="secondary" icon={Play}>Build APK</Button>
          <Button size="sm" variant="secondary" icon={Code}>Apply Patch</Button>
          <Button size="sm" variant="secondary" icon={FileText}>Analyze Code</Button>
        </div>
      </div>

      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
};
