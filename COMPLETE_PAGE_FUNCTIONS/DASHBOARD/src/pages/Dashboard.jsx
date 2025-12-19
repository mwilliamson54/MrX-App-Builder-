import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks';
import { ApiService } from '../services/ApiService';
import { Header, LeftSidebar, RightPanel } from '../layout';
import { ChatPanel } from '../components/chat';
import { CreateProjectModal } from '../components/projects';

// ============================================================================
// DASHBOARD PAGE COMPONENT - FIXED PROJECT HANDLING
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
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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

  // FIXED: Better project normalization with validation
  const normalizeProject = (project) => {
    if (!project) return null;
    
    // Ensure we have a valid projectId
    const projectId = project.projectId || project.id;
    if (!projectId || projectId.trim() === '') {
      console.warn('⚠️ Invalid project - missing ID:', project);
      return null;
    }
    
    // Ensure we have a valid name
    const name = project.name || projectId;
    if (!name || name.trim() === '') {
      console.warn('⚠️ Invalid project - missing name:', project);
      return null;
    }
    
    return {
      ...project,
      id: projectId,
      projectId: projectId,
      name: name.trim()
    };
  };

  // FIXED: Filter out invalid projects and normalize
  const loadProjects = async () => {
    try {
      const projectsData = await api.getProjects();
      console.log('✅ Raw projects loaded:', projectsData);
      
      // Normalize and filter out invalid projects
      const normalizedProjects = Array.isArray(projectsData) 
        ? projectsData
            .map(normalizeProject)
            .filter(p => p !== null) // Remove invalid projects
        : [];
      
      console.log('✅ Normalized projects:', normalizedProjects);
      
      setProjects(normalizedProjects);
      
      if (normalizedProjects.length > 0) {
        setCurrentProject(normalizedProjects[0]);
        console.log('✅ Current project set to:', normalizedProjects[0]);
      } else {
        console.warn('⚠️ No valid projects found');
        setCurrentProject(null);
        setShowCreateProjectModal(true);
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      setProjects([]);
      setCurrentProject(null);
      setShowCreateProjectModal(true);
    }
  };

  // FIXED: Better chat normalization
  const normalizeChat = (chat) => {
    if (!chat) return null;
    
    const chatId = chat.chatId || chat.id;
    if (!chatId || chatId.trim() === '') {
      console.warn('⚠️ Invalid chat - missing ID:', chat);
      return null;
    }
    
    return {
      ...chat,
      id: chatId,
      chatId: chatId,
      title: chat.title || 'Untitled Chat'
    };
  };

  const loadChats = async () => {
    try {
      const chatsData = await api.getChats(currentProject.id);
      console.log('Loaded chats:', chatsData);

      const normalizedChats = Array.isArray(chatsData)
        ? chatsData
            .map(normalizeChat)
            .filter(c => c !== null)
        : [];
      
      setChats(normalizedChats);
      if (normalizedChats.length > 0) {
        setCurrentChat(normalizedChats[0]);
      } else {
        console.log('No chats found, user should create one');
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
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
    if (!currentProject) {
      alert('No project selected. Please select or create a project first.');
      return;
    }

    console.log('🔵 Creating new chat for project:', currentProject.id);
    setIsCreatingChat(true);
    
    try {
      const payload = {
        title: 'New Chat',
        llmMode: 'custom'
      };
      
      console.log('📤 Sending payload:', payload);
      
      const newChatData = await api.createChat(currentProject.id, payload);
      
      console.log('✅ Chat created successfully:', newChatData);
      
      const rawChat = newChatData.chat || newChatData;
      const newChat = normalizeChat(rawChat);
      
      if (!newChat) {
        throw new Error('Invalid chat response from server - missing chat ID');
      }
      
      console.log('✅ New chat object:', newChat);
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
      alert(`Failed to create chat: ${error.message}`);
      setCurrentChat(null);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatSelect = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
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

  // FIXED: Better project creation with validation
  const handleCreateProject = async (projectData) => {
    console.log('🔵 Creating new project:', projectData);
    setIsCreatingProject(true);
    
    try {
      // Validate inputs before sending
      if (!projectData.name || projectData.name.trim() === '') {
        throw new Error('Project name is required');
      }
      
      if (!projectData.repoUrl || projectData.repoUrl.trim() === '') {
        throw new Error('Repository URL is required');
      }
      
      const newProjectData = await api.createProject({
        name: projectData.name.trim(),
        repoUrl: projectData.repoUrl.trim(),
        description: projectData.description?.trim() || ''
      });
      
      console.log('✅ Project created successfully:', newProjectData);
      
      const rawProject = newProjectData.project || newProjectData;
      const newProject = normalizeProject(rawProject);
      
      if (!newProject) {
        throw new Error('Invalid project response from server');
      }
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      
      console.log('✅ Project set as current:', newProject);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      alert(`Failed to create project: ${error.message}`);
      return false;
    } finally {
      setIsCreatingProject(false);
    }
  };

  // FIXED: Safer project change with validation
  const handleProjectChange = (projectId) => {
    if (!projectId || projectId.trim() === '') {
      console.warn('⚠️ Invalid projectId provided');
      return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      console.log('✅ Switched to project:', project);
    } else {
      console.warn('⚠️ Project not found:', projectId);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="h-screen flex flex-col">
        <Header 
          currentProject={currentProject}
          projects={projects}
          onProjectChange={handleProjectChange}
          onCreateProject={() => setShowCreateProjectModal(true)}
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
            isCreatingChat={isCreatingChat}
          />

          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            hasActiveChat={!!currentChat}
            hasProject={!!currentProject}
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

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreate={handleCreateProject}
        isLoading={isCreatingProject}
      />
    </div>
  );
};