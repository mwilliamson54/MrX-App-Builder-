import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Clock, ChevronRight, ChevronLeft, Loader2, X } from 'lucide-react';
import { Input, Button } from '../components/ui';

// ============================================================================
// LEFT SIDEBAR COMPONENT - MOBILE RESPONSIVE
// ============================================================================

export const LeftSidebar = ({ 
  projects, 
  chats, 
  onChatSelect, 
  onNewChat, 
  currentChatId, 
  isCollapsed, 
  onToggleCollapse, 
  isCreatingChat 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const filteredChats = chats.filter(chat => {
    if (filter === 'recent') return true;
    if (filter === 'errors') return chat.hasErrors;
    return chat.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className={`hidden md:flex border-r border-gray-800 bg-gray-900 flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
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
        {isCollapsed ? <ChevronRight className="text-gray-400" size={20} /> : <ChevronLeft className="text-gray-400" size={20} />}
      </button>
    </aside>
  );

  // Mobile Floating Button & Sidebar
  const MobileSidebar = () => (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setShowMobileSidebar(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all"
      >
        <MessageSquare size={24} />
        {chats.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {chats.length}
          </span>
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">Chats</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-800">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                icon={Search}
              />
            </div>

            {/* Filters */}
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
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">{filteredChats.length} chats</span>
                <button 
                  onClick={() => {
                    onNewChat();
                    setShowMobileSidebar(false);
                  }}
                  disabled={isCreatingChat}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
                >
                  {isCreatingChat ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>New</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats yet</p>
                    <p className="text-xs mt-1">Create your first chat to get started</p>
                  </div>
                ) : (
                  filteredChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        onChatSelect(chat.id);
                        setShowMobileSidebar(false);
                      }}
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
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};