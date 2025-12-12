import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { 
  Menu, X, Plus, Send, Code, FileText, Activity, Download, 
  Settings, ChevronRight, ChevronDown, Search, Filter, 
  Play, Square, AlertCircle, CheckCircle, Clock, Loader2,
  Moon, Sun, RefreshCw, Terminal, GitBranch, Folder, File,
  MessageSquare, Trash2, Edit2, Copy, ExternalLink, Zap
} from 'lucide-react';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const POLL_INTERVAL = 3000; // 3 seconds
const LOG_BATCH_SIZE = 50;
const MESSAGE_BATCH_SIZE = 20;

// ============================================================================
// CONTEXTS
// ============================================================================

const AuthContext = createContext(null);
const ThemeContext = createContext(null);
const ProjectContext = createContext(null);
const ChatContext = createContext(null);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

// Auth Hook
const useAuth = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem('sessionToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [user, setUser] = useState(() => {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  });

  const login = useCallback((newToken, userData) => {
    sessionStorage.setItem('sessionToken', newToken);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { token, isAuthenticated, user, login, logout };
};

// Theme Hook
const useTheme = () => {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('theme') || 'dark'
  );

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme };
};

// API Hook
const useApi = (token) => {
  const request = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }, [token]);

  return { request };
};

// Polling Hook
const usePolling = (callback, interval, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);
    tick(); // Call immediately

    return () => clearInterval(id);
  }, [interval, enabled]);
};

// ============================================================================
// API SERVICE
// ============================================================================

class ApiService {
  constructor(request) {
    this.request = request;
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  // Chats
  async getChats(projectId) {
    return this.request(`/projects/${projectId}/chats`);
  }

  async createChat(projectId, data) {
    return this.request(`/projects/${projectId}/chats`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMessages(projectId, chatId, cursor = 0) {
    return this.request(`/projects/${projectId}/chats/${chatId}/messages?cursor=${cursor}`);
  }

  async sendMessage(projectId, chatId, data) {
    return this.request(`/projects/${projectId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Jobs
  async createJob(data) {
    return this.request('/jobs/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getJobLogs(jobId, cursor = 0) {
    return this.request(`/jobs/${jobId}/logs?cursor=${cursor}`);
  }

  // Files
  async getFileTree(projectId) {
    return this.request(`/projects/${projectId}/file-tree`);
  }

  async getFile(projectId, path) {
    return this.request(`/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
  }

  async getDiff(projectId, commitA, commitB) {
    return this.request(`/projects/${projectId}/diff?commitA=${commitA}&commitB=${commitB}`);
  }

  // Artifacts
  async getArtifacts(projectId) {
    return this.request(`/projects/${projectId}/artifacts`);
  }
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Button Component
const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
    ghost: 'hover:bg-gray-700/50 text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
};

// Input Component
const Input = ({ value, onChange, placeholder, icon: Icon, className = '', ...props }) => {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  );
};

// Badge Component
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const Header = ({ currentProject, onProjectChange, jobStatus, theme, onThemeToggle }) => {
  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold text-gray-100">MrX Builder</h1>
        </div>
        
        {currentProject && (
          <select 
            value={currentProject.id}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={currentProject.id}>{currentProject.name}</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-4">
        {jobStatus && (
          <Badge variant={jobStatus.state === 'running' ? 'info' : jobStatus.state === 'completed' ? 'success' : 'default'}>
            {jobStatus.state === 'running' && <Loader2 className="animate-spin" size={12} />}
            {jobStatus.state}
          </Badge>
        )}
        
        <button 
          onClick={onThemeToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="text-gray-400" size={20} /> : <Moon className="text-gray-400" size={20} />}
        </button>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400">Connected</span>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// LEFT SIDEBAR COMPONENT
// ============================================================================

const LeftSidebar = ({ projects, chats, onChatSelect, onNewChat, currentChatId, isCollapsed, onToggleCollapse }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredChats = chats.filter(chat => {
    if (filter === 'recent') return true; // Implement recent logic
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
                className="p-1 hover:bg-gray-800 rounded-md transition-colors"
              >
                <Plus className="text-gray-400" size={16} />
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

// ============================================================================
// CENTER PANEL - CHAT COMPONENT
// ============================================================================

const ChatMessage = ({ message }) => {
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

const ChatInput = ({ onSend, isLoading }) => {
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
    setOpenAiKey(''); // Clear key after use
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

const CenterPanel = ({ messages, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

// ============================================================================
// RIGHT PANEL COMPONENT
// ============================================================================

const FileTreeItem = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFolder = item.type === 'folder';

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            setIsExpanded(!isExpanded);
          } else {
            onSelect(item.path);
          }
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded text-sm text-gray-300"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isFolder ? (
          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : null}
        {isFolder ? <Folder size={14} className="text-blue-400" /> : <File size={14} className="text-gray-500" />}
        <span className="flex-1 text-left truncate">{item.name}</span>
      </button>

      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child, idx) => (
            <FileTreeItem key={idx} item={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const CodeViewer = ({ code, language = 'kotlin' }) => {
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

const LogViewer = ({ logs, isStreaming }) => {
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

const RightPanel = ({ activeTab, fileTree, selectedFile, logs, artifacts, onFileSelect, isCollapsed }) => {
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
          <div className="space-y-3">
            {artifacts && artifacts.length > 0 ? (
              artifacts.map((artifact, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Download size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-gray-200">{artifact.filename}</span>
                    </div>
                    <Badge variant="success">Ready</Badge>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Size: {(artifact.size / 1024 / 1024).toFixed(2)} MB</div>
                    <div>Built: {new Date(artifact.uploadedAt).toLocaleString()}</div>
                  </div>
                  <Button size="sm" className="w-full mt-3" icon={Download}>
                    Download APK
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No artifacts yet</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App = () => {
  // Auth & Theme
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  // State
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState(null);
  const [logs, setLogs] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [jobStatus, setJobStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // API
  const { request } = useApi(auth.token);
  const api = new ApiService(request);

  // Real Authentication - No mock data
const [showLogin, setShowLogin] = useState(!auth.isAuthenticated);
const [loginError, setLoginError] = useState('');
const [isLoggingIn, setIsLoggingIn] = useState(false);

const handleLogin = async (username, password) => {
  setIsLoggingIn(true);
  setLoginError('');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      auth.login(data.token, data.user);
      setShowLogin(false);
    } else {
      setLoginError(data.message || 'Invalid username or password');
    }
  } catch (error) {
    console.error('Login failed:', error);
    setLoginError('Failed to connect to server. Please try again.');
  } finally {
    setIsLoggingIn(false);
  }
};

  // Load projects on mount
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadProjects();
    }
  }, [auth.isAuthenticated]);

  // Load project data when project changes
  useEffect(() => {
    if (currentProject) {
      loadChats();
      loadFileTree();
      loadArtifacts();
    }
  }, [currentProject]);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChat) {
      loadMessages();
    }
  }, [currentChat]);

  // Functions
  const loadProjects = async () => {
    try {
      // Mock data for demo
      const mockProjects = [
        { id: 'mrx-weather', name: 'Weather App', repoUrl: 'github.com/user/mrx-weather' },
        { id: 'mrx-todo', name: 'Todo App', repoUrl: 'github.com/user/mrx-todo' }
      ];
      setProjects(mockProjects);
      setCurrentProject(mockProjects[0]);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadChats = async () => {
    try {
      // Mock data
      const mockChats = [
        { 
          id: 'chat-1', 
          title: 'Initial Setup', 
          lastUpdated: new Date().toISOString(),
          hasErrors: false
        },
        { 
          id: 'chat-2', 
          title: 'Add Weather API', 
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
          hasErrors: false
        },
        { 
          id: 'chat-3', 
          title: 'Fix UI Bug', 
          lastUpdated: new Date(Date.now() - 172800000).toISOString(),
          hasErrors: true
        }
      ];
      setChats(mockChats);
      setCurrentChat(mockChats[0]);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // Mock messages
      const mockMessages = [
        {
          sender: 'user',
          content: 'Create a new weather app with Material Design',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          meta: { tokens: 12 }
        },
        {
          sender: 'ai',
          content: 'I\'ll help you create a weather app with Material Design. Let me start by setting up the project structure with the necessary dependencies and creating the main activity with a modern UI.',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          meta: { tokens: 156, jobId: 'job-001' }
        },
        {
          sender: 'system',
          content: 'Build completed successfully. APK ready for download.',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          meta: { jobId: 'job-001' }
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadFileTree = async () => {
    try {
      // Mock file tree
      const mockFileTree = [
        {
          name: 'app',
          type: 'folder',
          children: [
            {
              name: 'src',
              type: 'folder',
              children: [
                {
                  name: 'main',
                  type: 'folder',
                  children: [
                    {
                      name: 'java',
                      type: 'folder',
                      children: [
                        {
                          name: 'com',
                          type: 'folder',
                          children: [
                            { name: 'MainActivity.kt', type: 'file', path: 'app/src/main/java/com/MainActivity.kt' },
                            { name: 'WeatherViewModel.kt', type: 'file', path: 'app/src/main/java/com/WeatherViewModel.kt' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'res',
                      type: 'folder',
                      children: [
                        {
                          name: 'layout',
                          type: 'folder',
                          children: [
                            { name: 'activity_main.xml', type: 'file', path: 'app/src/main/res/layout/activity_main.xml' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        { name: 'build.gradle.kts', type: 'file', path: 'build.gradle.kts' },
        { name: 'settings.gradle.kts', type: 'file', path: 'settings.gradle.kts' }
      ];
      setFileTree(mockFileTree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const loadArtifacts = async () => {
    try {
      // Mock artifacts
      const mockArtifacts = [
        {
          artifactId: 'apk-001',
          filename: 'WeatherApp-release-v1.0.0.apk',
          size: 5242880,
          uploadedAt: new Date().toISOString(),
          drivePath: 'MrX App Builder/WeatherApp/...'
        }
      ];
      setArtifacts(mockArtifacts);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!currentProject || !currentChat) return;

    setIsLoading(true);

    // Optimistic UI update
    const userMessage = {
      sender: 'user',
      content: messageData.content,
      timestamp: new Date().toISOString(),
      meta: {}
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock AI response
      const aiMessage = {
        sender: 'ai',
        content: 'I understand your request. Let me work on that for you. I\'ll analyze the codebase and make the necessary changes.',
        timestamp: new Date().toISOString(),
        meta: { tokens: 187, jobId: 'job-' + Date.now() }
      };
      setMessages(prev => [...prev, aiMessage]);

      // Simulate job status
      setJobStatus({ state: 'running', jobId: aiMessage.meta.jobId });

      setTimeout(() => {
        setJobStatus({ state: 'completed', jobId: aiMessage.meta.jobId });
        
        const systemMessage = {
          sender: 'system',
          content: 'Task completed successfully!',
          timestamp: new Date().toISOString(),
          meta: { jobId: aiMessage.meta.jobId }
        };
        setMessages(prev => [...prev, systemMessage]);
      }, 3000);

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        sender: 'system',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
        meta: {}
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newChat = {
      id: 'chat-' + Date.now(),
      title: 'New Chat',
      lastUpdated: new Date().toISOString(),
      hasErrors: false
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    setMessages([]);
  };

  const handleChatSelect = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setCurrentChat(chat);
  };

  const handleFileSelect = async (path) => {
    try {
      // Mock file content
      const mockCode = `package com.example.weather

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import androidx.lifecycle.ViewModelProvider

class MainActivity : AppCompatActivity() {
    
    private lateinit var viewModel: WeatherViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        viewModel = ViewModelProvider(this).get(WeatherViewModel::class.java)
        
        setupUI()
        observeWeatherData()
    }
    
    private fun setupUI() {
        // Setup Material Design components
    }
    
    private fun observeWeatherData() {
        viewModel.weatherData.observe(this) { weather ->
            // Update UI with weather data
        }
    }
}`;
      
      // For demo, we'll show code in a new message
      const codeMessage = {
        sender: 'system',
        content: `File: ${path}\n\n${mockCode}`,
        timestamp: new Date().toISOString(),
        meta: {}
      };
      setMessages(prev => [...prev, codeMessage]);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="h-screen flex flex-col">
        <Header 
          currentProject={currentProject}
          onProjectChange={(id) => setCurrentProject(projects.find(p => p.id === id))}
          jobStatus={jobStatus}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar
            projects={projects}
            chats={chats}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            currentChatId={currentChat?.id}
            isCollapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          />

          <CenterPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />

          <RightPanel
            activeTab="files"
            fileTree={fileTree}
            logs={logs}
            artifacts={artifacts}
            onFileSelect={handleFileSelect}
            isCollapsed={rightCollapsed}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
