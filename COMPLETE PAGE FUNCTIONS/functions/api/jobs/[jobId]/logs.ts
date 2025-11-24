// functions/api/jobs/[jobId]/logs.ts
import type { Env } from '../../../../types';
import { requireAuth } from '../../../../lib/auth/session';
import { getLogSegments, appendLogSegment } from '../../../../lib/kv/logs';
import { createErrorResponse, ErrorCodes } from '../../../../lib/utils/errors';
import { validateColabAgent } from '../../../../lib/auth/colab';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    // Validate session (dashboard user)
    await requireAuth(request, env);
    
    const { jobId } = params;
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    
    // Find the job's projectId
    const { keys } = await env.KV.list({ prefix: 'project:' });
    let projectId: string | null = null;
    
    for (const key of keys) {
      if (key.name.includes(`:job:${jobId}`)) {
        const match = key.name.match(/^project:([^:]+):/);
        if (match) {
          projectId = match[1];
          break;
        }
      }
    }
    
    if (!projectId) {
      return createErrorResponse(
        ErrorCodes.JOB_NOT_FOUND,
        `Job ${jobId} not found`,
        404
      );
    }
    
    const logs = await getLogSegments(
      projectId,
      jobId as string,
      cursor,
      env
    );
    
    return new Response(JSON.stringify(logs), {
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
      'Failed to get logs',
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    // Validate Colab agent (only Colab can append logs)
    await validateColabAgent(request, env);
    
    const { jobId } = params;
    const body = await request.json();
    const { timestamp, level, message, metadata } = body;
    
    if (!timestamp || !level || !message) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'timestamp, level, and message are required',
        400
      );
    }
    
    // Find the job's projectId
    const { keys } = await env.KV.list({ prefix: 'project:' });
    let projectId: string | null = null;
    
    for (const key of keys) {
      if (key.name.includes(`:job:${jobId}`)) {
        const match = key.name.match(/^project:([^:]+):/);
        if (match) {
          projectId = match[1];
          break;
        }
      }
    }
    
    if (!projectId) {
      return createErrorResponse(
        ErrorCodes.JOB_NOT_FOUND,
        `Job ${jobId} not found`,
        404
      );
    }
    
    await appendLogSegment(
      projectId,
      jobId as string,
      { timestamp, level, message, metadata },
      env
    );
    
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to append log',
      500
    );
  }
};

