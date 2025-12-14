// functions/api/projects/[projectId]/index.ts
import type { Env } from '../../../../types';
import { requireAuth } from '../../../../lib/auth/session';
import { getProject } from '../../../../lib/kv/projects';
import { createErrorResponse, ErrorCodes } from '../../../../lib/utils/errors';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId } = params;
    
    if (!projectId) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Project ID is required',
        400
      );
    }
    
    const project = await getProject(projectId as string, env);
    
    if (!project) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    return new Response(JSON.stringify(project), {
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
      'Failed to get project',
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
