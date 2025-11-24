// lib/github/client.ts
import type { Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'MrX-App-Builder',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      Logger.error('GitHub API error', { 
        status: response.status,
        endpoint,
        error 
      });
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        `GitHub API error: ${response.status}`,
        response.status
      );
    }
    
    // Handle rate limits
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 10) {
      Logger.warn('GitHub rate limit low', { remaining });
    }
    
    return response.json() as Promise<T>;
  }
  
  async listRepositories(org?: string): Promise<GitHubRepository[]> {
    try {
      const endpoint = org 
        ? `/orgs/${org}/repos?per_page=100`
        : '/user/repos?per_page=100&affiliation=owner,collaborator';
      
      const repos = await this.request<GitHubRepository[]>(endpoint);
      
      Logger.info('Listed GitHub repositories', { count: repos.length, org });
      return repos;
    } catch (error) {
      Logger.error('Failed to list repositories', { org, error });
      throw error;
    }
  }
  
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const endpoint = `/repos/${owner}/${repo}`;
      const repository = await this.request<GitHubRepository>(endpoint);
      
      Logger.info('Retrieved GitHub repository', { owner, repo });
      return repository;
    } catch (error) {
      Logger.error('Failed to get repository', { owner, repo, error });
      throw error;
    }
  }
  
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const endpoint = `/repos/${owner}/${repo}/branches`;
      const branches = await this.request<GitHubBranch[]>(endpoint);
      
      Logger.info('Retrieved repository branches', { owner, repo, count: branches.length });
      return branches;
    } catch (error) {
      Logger.error('Failed to get branches', { owner, repo, error });
      throw error;
    }
  }
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

