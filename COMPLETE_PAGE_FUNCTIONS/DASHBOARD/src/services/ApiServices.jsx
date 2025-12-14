// ============================================================================
// API SERVICE
// ============================================================================

export class ApiService {
  constructor(request) {
    this.request = request;
  }

  // Projects
  async getProjects() {
    return this.request('/api/projects');
  }

  async getProject(id) {
    return this.request(`/api/projects/${id}`);
  }

  // Chats
  async getChats(projectId) {
    return this.request(`/api/projects/${projectId}/chats`);
  }

  async createChat(projectId, data) {
    return this.request(`/api/projects/${projectId}/chats`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMessages(projectId, chatId, cursor = 0) {
    return this.request(`/api/projects/${projectId}/chats/${chatId}/messages?cursor=${cursor}`);
  }

  async sendMessage(projectId, chatId, data) {
    return this.request(`/api/projects/${projectId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Jobs
  async createJob(data) {
    return this.request('/api/jobs/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getJobLogs(jobId, cursor = 0) {
    return this.request(`/api/jobs/${jobId}/logs?cursor=${cursor}`);
  }

  // Files
  async getFileTree(projectId) {
    return this.request(`/api/projects/${projectId}/file-tree`);
  }

  async getFile(projectId, path) {
    return this.request(`/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
  }

  async getDiff(projectId, commitA, commitB) {
    return this.request(`/api/projects/${projectId}/diff?commitA=${commitA}&commitB=${commitB}`);
  }

  // Artifacts
  async getArtifacts(projectId) {
    return this.request(`/api/projects/${projectId}/artifacts`);
  }
}
