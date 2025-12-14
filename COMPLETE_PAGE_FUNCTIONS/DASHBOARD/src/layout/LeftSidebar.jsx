import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Clock, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Input, Button } from '../components/ui';

// ============================================================================
// LEFT SIDEBAR COMPONENT
// ============================================================================

export const LeftSidebar = ({ projects, chats, onChatSelect, onNewChat, currentChatId, isCollapsed, onToggleCollapse, isCreatingChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredChats = chats.filter(chat => {
    if (filter === 'recent') return true;
    if (filter === 'errors') return chat.hasErrors;
    return chat.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside className={`border-r border-gray-800 bg-gray-900 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      {!isCollapsed && (
        <>
          <div className="p-4 border-b border-gray-800">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              icon={Search}
            />
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-800">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'primary' : 'ghost'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'recent' ? 'primary' : 'ghost'}
              onClick={() => setFilter('recent')}
            >
              Recent
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'errors' ? 'primary' : 'ghost'}
              onClick={() => setFilter('errors')}
            >
              Errors
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Chats</h3>
              <button 
                onClick={onNewChat}
                disabled={isCreatingChat}
                className="p-1 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isCreatingChat ? 'Creating chat...' : 'New chat'}
              >
                {isCreatingChat ? (
                  <Loader2 className="text-blue-400 animate-spin" size={16} />
                ) : (
                  <Plus className="text-gray-400" size={16} />
                )}
              </button>
            </div>

            <div className="space-y-2">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    currentChatId === chat.id 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span className="flex-1 truncate font-medium">{chat.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                    <Clock size={12} />
                    <span>{new Date(chat.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button 
        onClick={onToggleCollapse}
        className="p-4 border-t border-gray-800 hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        {isCollapsed ? <ChevronRight className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
      </button>
    </aside>
  );
};