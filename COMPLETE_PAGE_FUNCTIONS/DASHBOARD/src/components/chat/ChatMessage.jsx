import React from 'react';

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================

export const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} ${isSystem ? 'justify-center' : ''}`}>
      {!isSystem && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-purple-600'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
      )}
      
      <div className={`flex-1 max-w-3xl ${isSystem ? 'max-w-md' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 
          isSystem ? 'bg-gray-700/50 text-gray-300 border border-gray-700' : 
          'bg-gray-800 text-gray-100'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.meta && (
            <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs opacity-70 flex items-center gap-4">
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              {message.meta.tokens && <span>{message.meta.tokens} tokens</span>}
              {message.meta.jobId && <span>Job: {message.meta.jobId}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};