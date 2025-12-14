// lib/github/repos.ts
import type { Project, Env } from '../../types';
import { retrieveSecret } from '../kv/secrets';
import { createProject, getProject } from '../kv/projects';
import { GitHubClient } from './client';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

const MRX_REPO_PREFIX = 'mrx-';

export async function listMrxRepositories(env: Env): Promise<Project[]> {
  try {
    // Get GitHub PAT from secrets
    const token = await retrieveSecret('github', 'master', env);
    
    if (!token) {
      Logger.warn('GitHub PAT not configured');
      return [];
    }
    
    const client = new GitHubClient(token);
    const repos = await client.listRepositories();
    
    // Filter repos with mrx- prefix
    const mrxRepos = repos.filter(repo => 
      repo.name.startsWith(MRX_REPO_PREFIX)
    );
    
    const projects: Project[] = [];
    
    for (const repo of mrxRepos) {
      const projectId = repo.name.substring(MRX_REPO_PREFIX.length);
      
      // Check if project already exists in KV
      let project = await getProject(projectId, env);
      
      if (!project) {
        // Create new project entry
        project = await createProject({
          projectId,
          name: projectId,
          repo: repo.html_url,
          defaultBranch: repo.default_branch
        }, env);
      }
      
      projects.push(project);
    }
    
    Logger.info('Listed MrX repositories', { count: projects.length });
    return projects;
  } catch (error) {
    Logger.error('Failed to list MrX repositories', { error });
    throw error;
  }
}

export async function getRepositoryMetadata(
  repoUrl: string,
  env: Env
): Promise<{ owner: string; repo: string; defaultBranch: string }> {
  try {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new AppError(ErrorCodes.INVALID_REQUEST, 'Invalid GitHub repository URL', 400);
    }
    
    const [, owner, repo] = match;
    
    // Get GitHub PAT
    const token = await retrieveSecret('github', 'master', env);
    if (!token) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'GitHub PAT not configured', 500);
    }
    
    const client = new GitHubClient(token);
    const repository = await client.getRepository(owner, repo);
    
    return {
      owner,
      repo,
      defaultBranch: repository.default_branch
    };
  } catch (error) {
    Logger.error('Failed to get repository metadata', { repoUrl, error });
    throw error;
  }
}
