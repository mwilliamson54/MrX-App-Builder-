import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button, Input, Modal } from '../ui';

// ============================================================================
// CHAT INPUT COMPONENT
// ============================================================================

export const ChatInput = ({ onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [llmMode, setLlmMode] = useState('custom');
  const [openAiKey, setOpenAiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSend({
      content: message,
      llmMode,
      ...(llmMode === 'openai' && { openAiKey })
    });

    setMessage('');
    setOpenAiKey('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={llmMode}
          onChange={(e) => {
            setLlmMode(e.target.value);
            if (e.target.value === 'openai') setShowKeyModal(true);
          }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="custom">Custom LLM</option>
          <option value="openai">OpenAI</option>
        </select>

        {llmMode === 'openai' && (
          <button 
            onClick={() => setShowKeyModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Set API Key
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !message.trim()}
          icon={Send}
        >
          Send
        </Button>
      </div>

      <Modal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} title="OpenAI API Key">
        <p className="text-gray-400 mb-4">
          Enter your OpenAI API key. It will only be used for this request and never stored.
        </p>
        <Input
          type="password"
          value={openAiKey}
          onChange={(e) => setOpenAiKey(e.target.value)}
          placeholder="sk-..."
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShowKeyModal(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
};