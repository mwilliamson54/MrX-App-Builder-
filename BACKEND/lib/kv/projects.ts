// lib/kv/projects.ts
import type { Project, Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { toISOString } from '../utils/dates';

const PROJECT_PREFIX = 'project:';

function getProjectKey(projectId: string): string {
  return `${PROJECT_PREFIX}${projectId}:meta`;
}

export async function listProjects(env: Env): Promise<Project[]> {
  try {
    const { keys } = await env.KV.list({ prefix: PROJECT_PREFIX });
    
    const projects: Project[] = [];
    
    for (const key of keys) {
      // Only get meta keys
      if (key.name.endsWith(':meta')) {
        const projectData = await env.KV.get(key.name, { type: 'json' });
        if (projectData) {
          projects.push(projectData as Project);
        }
      }
    }
    
    // Sort by updatedAt descending
    projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    Logger.info('Listed projects', { count: projects.length });
    return projects;
  } catch (error) {
    Logger.error('Failed to list projects', { error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to list projects', 500);
  }
}

export async function getProject(projectId: string, env: Env): Promise<Project | null> {
  try {
    const key = getProjectKey(projectId);
    const project = await env.KV.get(key, { type: 'json' });
    
    if (!project) {
      Logger.warn('Project not found', { projectId });
      return null;
    }
    
    return project as Project;
  } catch (error) {
    Logger.error('Failed to get project', { projectId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get project', 500);
  }
}

export async function createProject(data: Omit<Project, 'createdAt' | 'updatedAt'>, env: Env): Promise<Project> {
  try {
    const now = toISOString();
    const project: Project = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    const key = getProjectKey(project.projectId);
    await env.KV.put(key, JSON.stringify(project));
    
    Logger.info('Created project', { projectId: project.projectId });
    return project;
  } catch (error) {
    Logger.error('Failed to create project', { projectId: data.projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to create project', 500);
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'projectId' | 'createdAt' | 'updatedAt'>>,
  env: Env
): Promise<Project> {
  try {
    const existing = await getProject(projectId, env);
    
    if (!existing) {
      throw new AppError(ErrorCodes.PROJECT_NOT_FOUND, `Project ${projectId} not found`, 404);
    }
    
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: toISOString()
    };
    
    const key = getProjectKey(projectId);
    await env.KV.put(key, JSON.stringify(updated));
    
    Logger.info('Updated project', { projectId });
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    Logger.error('Failed to update project', { projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to update project', 500);
  }
}

export async function deleteProject(projectId: string, env: Env): Promise<void> {
  try {
    // Delete project metadata
    const key = getProjectKey(projectId);
    await env.KV.delete(key);
    
    // TODO: Cascade delete chats, jobs, logs, artifacts
    // This should be implemented with a proper cleanup job
    
    Logger.info('Deleted project', { projectId });
  } catch (error) {
    Logger.error('Failed to delete project', { projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to delete project', 500);
  }
}

export async function projectExists(projectId: string, env: Env): Promise<boolean> {
  const project = await getProject(projectId, env);
  return project !== null;
}