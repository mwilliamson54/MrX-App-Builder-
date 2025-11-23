// lib/kv/jobs.ts
import type { Job, Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { toISOString, addMinutes, isExpired } from '../utils/dates';
import { generateJobId } from '../utils/generators';

const JOB_CLAIM_TTL_MINUTES = 30;

function getJobKey(projectId: string, jobId: string): string {
  return `project:${projectId}:job:${jobId}`;
}

function getJobQueueKey(): string {
  return 'jobs:queue:pending';
}

export async function createJob(
  projectId: string,
  jobData: {
    type: 'chat' | 'patch' | 'build' | 'index-rebuild';
    payload: Record<string, any>;
  },
  env: Env
): Promise<Job> {
  try {
    const jobId = generateJobId();
    const now = toISOString();
    
    const job: Job = {
      jobId,
      projectId,
      type: jobData.type,
      state: 'pending',
      payload: jobData.payload,
      claimedBy: null,
      claimExpiry: null,
      createdAt: now,
      updatedAt: now
    };
    
    // Store job
    const key = getJobKey(projectId, jobId);
    await env.KV.put(key, JSON.stringify(job));
    
    // Add to pending queue
    const queueKey = getJobQueueKey();
    const queue = await env.KV.get(queueKey, { type: 'json' }) as string[] || [];
    queue.push(jobId);
    await env.KV.put(queueKey, JSON.stringify(queue));
    
    Logger.info('Created job', { projectId, jobId, type: jobData.type });
    return job;
  } catch (error) {
    Logger.error('Failed to create job', { projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to create job', 500);
  }
}

export async function claimJob(
  colabId: string,
  env: Env
): Promise<Job | null> {
  try {
    // Get pending queue
    const queueKey = getJobQueueKey();
    const queue = await env.KV.get(queueKey, { type: 'json' }) as string[] || [];
    
    if (queue.length === 0) {
      Logger.info('No pending jobs in queue', { colabId });
      return null;
    }
    
    // Try to claim jobs in order until successful
    for (let i = 0; i < queue.length; i++) {
      const jobId = queue[i];
      
      // Get job details to find projectId
      // We need to list all projects and find the job
      // This is inefficient, but works for free tier
      const job = await findJobById(jobId, env);
      
      if (!job) {
        // Job doesn't exist, remove from queue
        queue.splice(i, 1);
        await env.KV.put(queueKey, JSON.stringify(queue));
        i--;
        continue;
      }
      
      // Check if already claimed and not expired
      if (job.claimedBy && job.claimExpiry && !isExpired(job.claimExpiry)) {
        // Already claimed by someone else
        continue;
      }
      
      // Claim the job
      const now = new Date();
      const claimExpiry = addMinutes(now, JOB_CLAIM_TTL_MINUTES);
      
      const updatedJob: Job = {
        ...job,
        state: 'claimed',
        claimedBy: colabId,
        claimExpiry: claimExpiry.toISOString(),
        updatedAt: toISOString()
      };
      
      const key = getJobKey(job.projectId, jobId);
      await env.KV.put(key, JSON.stringify(updatedJob));
      
      // Remove from pending queue
      queue.splice(i, 1);
      await env.KV.put(queueKey, JSON.stringify(queue));
      
      Logger.info('Job claimed', { jobId, colabId });
      return updatedJob;
    }
    
    Logger.info('No claimable jobs found', { colabId });
    return null;
  } catch (error) {
    Logger.error('Failed to claim job', { colabId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to claim job', 500);
  }
}

export async function getJob(projectId: string, jobId: string, env: Env): Promise<Job | null> {
  try {
    const key = getJobKey(projectId, jobId);
    const job = await env.KV.get(key, { type: 'json' });
    
    if (!job) {
      Logger.warn('Job not found', { projectId, jobId });
      return null;
    }
    
    return job as Job;
  } catch (error) {
    Logger.error('Failed to get job', { projectId, jobId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get job', 500);
  }
}

export async function updateJobState(
  projectId: string,
  jobId: string,
  state: Job['state'],
  updates?: Partial<Pick<Job, 'payload' | 'error'>>,
  env: Env
): Promise<Job> {
  try {
    const existing = await getJob(projectId, jobId, env);
    
    if (!existing) {
      throw new AppError(ErrorCodes.JOB_NOT_FOUND, `Job ${jobId} not found`, 404);
    }
    
    // Validate state transition
    const validTransitions: Record<Job['state'], Job['state'][]> = {
      pending: ['claimed', 'failed'],
      claimed: ['running', 'failed'],
      running: ['completed', 'failed'],
      completed: [],
      failed: ['pending'] // Allow retry
    };
    
    const allowedStates = validTransitions[existing.state];
    if (!allowedStates.includes(state)) {
      throw new AppError(
        ErrorCodes.INVALID_STATE_TRANSITION,
        `Cannot transition from ${existing.state} to ${state}`,
        400
      );
    }
    
    const updated: Job = {
      ...existing,
      state,
      ...updates,
      updatedAt: toISOString()
    };
    
    const key = getJobKey(projectId, jobId);
    await env.KV.put(key, JSON.stringify(updated));
    
    Logger.info('Updated job state', { projectId, jobId, state });
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    Logger.error('Failed to update job state', { projectId, jobId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to update job state', 500);
  }
}

export async function listProjectJobs(projectId: string, env: Env): Promise<Job[]> {
  try {
    const prefix = `project:${projectId}:job:`;
    const { keys } = await env.KV.list({ prefix });
    
    const jobs: Job[] = [];
    
    for (const key of keys) {
      const jobData = await env.KV.get(key.name, { type: 'json' });
      if (jobData) {
        jobs.push(jobData as Job);
      }
    }
    
    // Sort by createdAt descending
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return jobs;
  } catch (error) {
    Logger.error('Failed to list jobs', { projectId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to list jobs', 500);
  }
}

// Helper to find job across all projects (used in claim)
async function findJobById(jobId: string, env: Env): Promise<Job | null> {
  try {
    // List all project prefixes
    const { keys } = await env.KV.list({ prefix: 'project:' });
    
    for (const key of keys) {
      if (key.name.includes(`:job:${jobId}`)) {
        const job = await env.KV.get(key.name, { type: 'json' });
        if (job) {
          return job as Job;
        }
      }
    }
    
    return null;
  } catch (error) {
    Logger.error('Failed to find job', { jobId, error });
    return null;
  }
}

export async function timeoutStaleJobs(env: Env): Promise<number> {
  try {
    const { keys } = await env.KV.list({ prefix: 'project:' });
    let timedOut = 0;
    
    for (const key of keys) {
      if (!key.name.includes(':job:')) continue;
      
      const job = await env.KV.get(key.name, { type: 'json' }) as Job;
      if (!job) continue;
      
      if (job.state === 'running' && job.claimExpiry && isExpired(job.claimExpiry)) {
        job.state = 'failed';
        job.error = 'Job timed out';
        job.updatedAt = toISOString();
        await env.KV.put(key.name, JSON.stringify(job));
        timedOut++;
        Logger.warn('Job timed out', { jobId: job.jobId });
      }
    }
    
    return timedOut;
  } catch (error) {
    Logger.error('Failed to timeout stale jobs', { error });
    return 0;
  }
}