import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks';
import { ApiService } from '../services/ApiService';
import { Header, LeftSidebar, RightPanel } from '../layout';
import { ChatPanel } from '../components/chat';

// ============================================================================
// DASHBOARD PAGE COMPONENT
// ============================================================================

export const Dashboard = ({ auth, theme, toggleTheme }) => {
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

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

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

  // Load functions
  const loadProjects = async () => {
    try {
      const projectsData = await api.getProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setCurrentProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Fallback to mock data
      const mockProjects = [
        { id: 'mrx-weather', name: 'Weather App', repoUrl: 'github.com/user/mrx-weather' },
        { id: 'mrx-todo', name: 'Todo App', repoUrl: 'github.com/user/mrx-todo' }
      ];
      setProjects(mockProjects);
      setCurrentProject(mockProjects[0]);
    }
  };

  const loadChats = async () => {
    try {
      const chatsData = await api.getChats(currentProject.id);
      console.log('Loaded chats:', chatsData);
      
      setChats(chatsData);
      if (chatsData.length > 0) {
        setCurrentChat(chatsData[0]);
      } else {
        // No chats exist - user needs to create one manually
        console.log('No chats found, user should create one');
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      // Don't set mock chats - let user know there's an issue
      setChats([]);
      setCurrentChat(null);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await api.getMessages(currentProject.id, currentChat.id);
      setMessages(messagesData.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const loadFileTree = async () => {
    try {
      const treeData = await api.getFileTree(currentProject.id);
      setFileTree(treeData);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      const mockFileTree = [
        {
          name: 'app',
          type: 'folder',
          children: [
            {
              name: 'src',
              type: 'folder',
              children: [
                { name: 'MainActivity.kt', type: 'file', path: 'app/src/MainActivity.kt' }
              ]
            }
          ]
        }
      ];
      setFileTree(mockFileTree);
    }
  };

  const loadArtifacts = async () => {
    try {
      const artifactsData = await api.getArtifacts(currentProject.id);
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
      setArtifacts([]);
    }
  };

  // Message handler
  const handleSendMessage = async (messageData) => {
    if (!currentProject || !currentChat) {
      console.error('No project or chat selected');
      return;
    }

    setIsLoading(true);

    const userMessage = {
      sender: 'user',
      content: messageData.content,
      timestamp: new Date().toISOString(),
      meta: {}
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.sendMessage(
        currentProject.id,
        currentChat.id,
        {
          content: messageData.content,
          role: 'user',
          metadata: {
            llmMode: messageData.llmMode,
            ...(messageData.openAiKey && { openAiKey: messageData.openAiKey })
          }
        }
      );

      if (response.jobId) {
        setJobStatus({ state: 'pending', jobId: response.jobId });
        
        const systemMessage = {
          sender: 'system',
          content: `Processing your request (Job: ${response.jobId})...`,
          timestamp: new Date().toISOString(),
          meta: { jobId: response.jobId }
        };
        setMessages(prev => [...prev, systemMessage]);

        pollJobStatus(response.jobId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        sender: 'system',
        content: `Failed to send message: ${error.message}`,
        timestamp: new Date().toISOString(),
        meta: { error: true }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId) => {
    let pollCount = 0;
    const maxPolls = 60;
    
    const poll = async () => {
      try {
        pollCount++;
        const logsResponse = await api.getJobLogs(jobId, logs.length);
        
        if (logsResponse && logsResponse.data) {
          setLogs(prev => [...prev, ...logsResponse.data]);
          
          const lastLog = logsResponse.data[logsResponse.data.length - 1];
          
          if (lastLog) {
            const isCompleted = 
              lastLog.message.toLowerCase().includes('completed') ||
              lastLog.message.toLowerCase().includes('finished') ||
              lastLog.message.toLowerCase().includes('success');
              
            const isFailed = 
              lastLog.message.toLowerCase().includes('failed') ||
              lastLog.message.toLowerCase().includes('error') ||
              lastLog.level === 'error';
            
            if (isCompleted) {
              setJobStatus({ state: 'completed', jobId });
              const completionMessage = {
                sender: 'system',
                content: '✅ Task completed successfully!',
                timestamp: new Date().toISOString(),
                meta: { jobId, completed: true }
              };
              setMessages(prev => [...prev, completionMessage]);
              return;
            }
            
            if (isFailed) {
              setJobStatus({ state: 'failed', jobId });
              const failureMessage = {
                sender: 'system',
                content: `❌ Task failed: ${lastLog.message}`,
                timestamp: new Date().toISOString(),
                meta: { jobId, failed: true }
              };
              setMessages(prev => [...prev, failureMessage]);
              return;
            }
          }
          
          if (pollCount === 1) {
            setJobStatus({ state: 'running', jobId });
          }
        }
        
        if (pollCount < maxPolls) {
          setTimeout(poll, 3000);
        } else {
          setJobStatus({ state: 'timeout', jobId });
          const timeoutMessage = {
            sender: 'system',
            content: '⏱️ Job is taking longer than expected.',
            timestamp: new Date().toISOString(),
            meta: { jobId, timeout: true }
          };
          setMessages(prev => [...prev, timeoutMessage]);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000);
        }
      }
    };
    
    setTimeout(poll, 2000);
  };

  const handleNewChat = async () => {
    try {
      const newChatData = await api.createChat(currentProject.id, {
        title: 'New Chat',
        llmMode: 'custom'
      });
      
      console.log('Chat created successfully:', newChatData);
      
      // Backend should return the chat object with an id
      const newChat = newChatData.chat || newChatData;
      
      if (!newChat || !newChat.id) {
        throw new Error('Invalid chat response from server');
      }
      
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
      
      // Show error to user instead of creating mock chat
      alert(`Failed to create chat: ${error.message}\n\nPlease check your connection and try again.`);
      
      // Don't create mock chats - they won't work with the backend
      setCurrentChat(null);
    }
  };

  const handleChatSelect = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setCurrentChat(chat);
  };

  const handleFileSelect = async (path) => {
    try {
      const fileData = await api.getFile(currentProject.id, path);
      const fileMessage = {
        sender: 'system',
        content: `File: ${path}\n\n${fileData.content || 'No content'}`,
        timestamp: new Date().toISOString(),
        meta: { file: path }
      };
      setMessages(prev => [...prev, fileMessage]);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="h-screen flex flex-col">
        <Header 
          currentProject={currentProject}
          onProjectChange={(id) => setCurrentProject(projects.find(p => p.id === id))}
          jobStatus={jobStatus}
          theme={theme}
          onThemeToggle={toggleTheme}
          onLogout={auth.logout}
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

          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            hasActiveChat={!!currentChat}
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
