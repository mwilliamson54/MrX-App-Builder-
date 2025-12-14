// functions/api/projects/index.ts
import type { Env } from '../../../types';
import { requireAuth } from '../../../lib/auth/session';
import { listMrxRepositories } from '../../../lib/github/repos';
import { createProject } from '../../../lib/kv/projects';
import { createErrorResponse, ErrorCodes } from '../../../lib/utils/errors';
import { Logger } from '../../../lib/utils/logger';

// GET /api/projects - List all projects
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Validate session
    await requireAuth(request, env);
    
    // List all MrX projects from GitHub
    const projects = await listMrxRepositories(env);
    
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      return createErrorResponse(
        (error as any).code,
        error.message,
        (error as any).statusCode
      );
    }
    
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to list projects',
      500
    );
  }
};

// POST /api/projects - Create a new project
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Validate session
    await requireAuth(request, env);
    
    const body = await request.json();
    const { name, repoUrl, description } = body;
    
    // Validate required fields
    if (!name || !repoUrl) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Project name and repository URL are required',
        400
      );
    }
    
    // Validate GitHub URL format
    const githubUrlPattern = /^https?:\/\/(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w-]+\/[\w-]+(\.git)?$/i;
    if (!githubUrlPattern.test(repoUrl)) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Invalid repository URL. Must be a valid GitHub, GitLab, or Bitbucket URL',
        400
      );
    }
    
    // Extract projectId from name (sanitize)
    const projectId = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!projectId || projectId.length === 0) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Invalid project name. Use only letters, numbers, and hyphens',
        400
      );
    }
    
    // Check if project already exists
    const { getProject } = await import('../../../lib/kv/projects');
    const existingProject = await getProject(projectId, env);
    
    if (existingProject) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        `Project "${projectId}" already exists`,
        409
      );
    }
    
    // Extract default branch from repo (or use 'main' as default)
    let defaultBranch = 'main';
    try {
      // Try to get repo metadata from GitHub
      const { getRepositoryMetadata } = await import('../../../lib/github/repos');
      const metadata = await getRepositoryMetadata(repoUrl, env);
      defaultBranch = metadata.defaultBranch;
    } catch (error) {
      Logger.warn('Could not fetch repository metadata, using default branch "main"', { 
        repoUrl, 
        error 
      });
    }
    
    // Create project
    const project = await createProject({
      projectId,
      name,
      repo: repoUrl,
      defaultBranch,
      ...(description && { description })
    }, env);
    
    Logger.info('Project created via API', { projectId, name });
    
    return new Response(JSON.stringify({ 
      success: true,
      project 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    Logger.error('Failed to create project', { error });
    
    if (error instanceof Error && 'statusCode' in error) {
      return createErrorResponse(
        (error as any).code,
        error.message,
        (error as any).statusCode
      );
    }
    
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create project',
      500
    );
  }
};

interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
  }): Promise<Response> | Response;
      }
