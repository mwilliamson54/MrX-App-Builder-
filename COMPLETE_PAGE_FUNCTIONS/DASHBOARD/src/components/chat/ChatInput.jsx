import React, { useState } from 'react';
import { Send, Settings2 } from 'lucide-react';
import { Button, Input, Modal } from '../ui';

// ============================================================================
// CHAT INPUT COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const ChatInput = ({ onSend, isLoading }) => {
  const [message, setMessage] = useState('');
  const [llmMode, setLlmMode] = useState('custom');
  const [openAiKey, setOpenAiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="border-t border-gray-800 bg-gray-900 shadow-lg">
      {/* Settings Bar - Collapsible on mobile */}
      <div className={`px-3 md:px-4 pt-3 md:pt-4 transition-all ${showSettings ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 flex gap-2 safe-area-bottom">
        {/* Settings Toggle - Mobile Only */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors self-end mb-1"
        >
          <Settings2 className="text-gray-400" size={20} />
        </button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base min-h-[44px]"
          rows={2}
        />
        
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !message.trim()}
          icon={Send}
          className="self-end whitespace-nowrap"
          size="md"
        >
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      {/* OpenAI Key Modal */}
      <Modal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} title="OpenAI API Key">
        <p className="text-gray-400 mb-4 text-sm md:text-base">
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