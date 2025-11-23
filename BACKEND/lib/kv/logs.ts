// lib/kv/logs.ts
import type { LogSegment, Env, PaginatedResponse } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger as SystemLogger } from '../utils/logger';
import { toISOString } from '../utils/dates';
import { createPaginatedResponse, parseCursor } from '../utils/pagination';

function getLogKey(projectId: string, jobId: string, segment: number): string {
  return `project:${projectId}:logs:${jobId}:segment:${segment}`;
}

export async function appendLogSegment(
  projectId: string,
  jobId: string,
  log: Omit<LogSegment, 'segment'>,
  env: Env
): Promise<void> {
  try {
    // Find the next available segment number
    let segment = 0;
    while (true) {
      const key = getLogKey(projectId, jobId, segment);
      const existing = await env.KV.get(key);
      
      if (!existing) {
        // This is the next available segment
        const logSegment: LogSegment = { ...log, segment };
        await env.KV.put(key, JSON.stringify(logSegment));
        break;
      }
      
      segment++;
    }
    
    SystemLogger.debug('Appended log segment', { projectId, jobId, segment });
  } catch (error) {
    SystemLogger.error('Failed to append log segment', { projectId, jobId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to append log segment', 500);
  }
}

export async function getLogSegments(
  projectId: string,
  jobId: string,
  cursor: string | null,
  env: Env
): Promise<PaginatedResponse<LogSegment>> {
  try {
    const startSegment = parseCursor(cursor);
    const logs: LogSegment[] = [];
    const maxSegments = 50; // Fetch up to 50 segments at once
    
    for (let i = startSegment; i < startSegment + maxSegments; i++) {
      const key = getLogKey(projectId, jobId, i);
      const logData = await env.KV.get(key, { type: 'json' });
      
      if (!logData) {
        // No more segments
        break;
      }
      
      logs.push(logData as LogSegment);
    }
    
    const nextCursor = startSegment + logs.length;
    const hasMore = logs.length === maxSegments;
    
    SystemLogger.debug('Retrieved log segments', { 
      projectId, 
      jobId, 
      count: logs.length,
      startSegment,
      nextCursor 
    });
    
    return createPaginatedResponse(
      logs,
      hasMore ? nextCursor.toString() : undefined,
      hasMore
    );
  } catch (error) {
    SystemLogger.error('Failed to get log segments', { projectId, jobId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get log segments', 500);
  }
}

export async function cleanupOldLogs(
  projectId: string,
  jobId: string,
  env: Env
): Promise<void> {
  try {
    const prefix = `project:${projectId}:logs:${jobId}:segment:`;
    const { keys } = await env.KV.list({ prefix });
    
    for (const key of keys) {
      await env.KV.delete(key.name);
    }
    
    SystemLogger.info('Cleaned up logs', { projectId, jobId, count: keys.length });
  } catch (error) {
    SystemLogger.error('Failed to cleanup logs', { projectId, jobId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to cleanup logs', 500);
  }
}

