// lib/kv/artifacts.ts
import type { Artifact, Env } from '../../types';
import { toISOString } from '../utils/dates';
import { generateArtifactId } from '../utils/generators';

function getArtifactsKey(projectId: string): string {
  return `project:${projectId}:artifacts`;
}

export async function addArtifact(
  projectId: string,
  artifactData: Omit<Artifact, 'artifactId' | 'projectId' | 'uploadedAt'>,
  env: Env
): Promise<Artifact> {
  try {
    const artifact: Artifact = {
      artifactId: generateArtifactId(),
      projectId,
      ...artifactData,
      uploadedAt: toISOString()
    };
    
    // Get existing artifacts
    const key = getArtifactsKey(projectId);
    const existing = await env.KV.get(key, { type: 'json' }) as Artifact[] || [];
    
    // Add new artifact
    existing.unshift(artifact); // Add to beginning (most recent first)
    
    // Keep only last 100 artifacts to save space
    const trimmed = existing.slice(0, 100);
    
    await env.KV.put(key, JSON.stringify(trimmed));
    
    SystemLogger.info('Added artifact', { projectId, artifactId: artifact.artifactId });
    return artifact;
  } catch (error) {
    SystemLogger.error('Failed to add artifact', { projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to add artifact', 500);
  }
}

export async function listArtifacts(projectId: string, env: Env): Promise<Artifact[]> {
  try {
    const key = getArtifactsKey(projectId);
    const artifacts = await env.KV.get(key, { type: 'json' }) as Artifact[] || [];
    
    SystemLogger.debug('Listed artifacts', { projectId, count: artifacts.length });
    return artifacts;
  } catch (error) {
    SystemLogger.error('Failed to list artifacts', { projectId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to list artifacts', 500);
  }
}

export async function getArtifact(
  projectId: string,
  artifactId: string,
  env: Env
): Promise<Artifact | null> {
  try {
    const artifacts = await listArtifacts(projectId, env);
    const artifact = artifacts.find(a => a.artifactId === artifactId);
    
    if (!artifact) {
      SystemLogger.warn('Artifact not found', { projectId, artifactId });
      return null;
    }
    
    return artifact;
  } catch (error) {
    SystemLogger.error('Failed to get artifact', { projectId, artifactId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get artifact', 500);
  }
}

export async function deleteArtifact(
  projectId: string,
  artifactId: string,
  env: Env
): Promise<void> {
  try {
    const key = getArtifactsKey(projectId);
    const artifacts = await env.KV.get(key, { type: 'json' }) as Artifact[] || [];
    
    const filtered = artifacts.filter(a => a.artifactId !== artifactId);
    await env.KV.put(key, JSON.stringify(filtered));
    
    SystemLogger.info('Deleted artifact', { projectId, artifactId });
  } catch (error) {
    SystemLogger.error('Failed to delete artifact', { projectId, artifactId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to delete artifact', 500);
  }
}