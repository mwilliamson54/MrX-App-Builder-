import React, { useRef, useEffect } from 'react';
import { MessageSquare, Play, Code, FileText } from 'lucide-react';
import { Button } from '../ui';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

// ============================================================================
// CHAT PANEL (CENTER PANEL) COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const ChatPanel = ({ messages, onSendMessage, isLoading, hasActiveChat, hasProject }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasProject) {
    return (
      <div className="flex-1 flex flex-col bg-gray-950 h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500 max-w-md px-6">
            <MessageSquare size={48} className="mb-4 opacity-20 mx-auto md:w-16 md:h-16" />
            <p className="text-base md:text-lg mb-2">No Project Selected</p>
            <p className="text-xs md:text-sm mb-4">Create a new project to get started with MrX Builder</p>
            <p className="text-xs text-gray-600">Click the menu icon to create your first project</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasActiveChat) {
    return (
      <div className="flex-1 flex flex-col bg-gray-950 h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <MessageSquare size={48} className="mb-4 opacity-20 mx-auto md:w-16 md:h-16" />
            <p className="text-base md:text-lg mb-2">No chat selected</p>
            <p className="text-xs md:text-sm">Open the chats menu to create or select a chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <MessageSquare size={48} className="mb-4 opacity-20 md:w-16 md:h-16" />
            <p className="text-base md:text-lg">Start a conversation</p>
            <p className="text-xs md:text-sm text-center">Ask me to build features, fix bugs, or analyze code</p>
          </div>
        ) : (
          messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - Hidden on small mobile, shown on tablet+ */}
      <div className="hidden sm:flex border-t border-gray-800 p-3 md:p-4 bg-gray-900 gap-2 overflow-x-auto flex-shrink-0">
        <Button size="sm" variant="secondary" icon={Play} className="whitespace-nowrap">
          Build APK
        </Button>
        <Button size="sm" variant="secondary" icon={Code} className="whitespace-nowrap">
          Apply Patch
        </Button>
        <Button size="sm" variant="secondary" icon={FileText} className="whitespace-nowrap">
          Analyze Code
        </Button>
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};