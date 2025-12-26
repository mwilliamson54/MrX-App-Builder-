// functions/api/colab/projects/[projectId].ts
// Colab-specific endpoint to get project metadata
// Uses Colab authentication instead of user session

import type { Env } from '../../../../types';
import { validateColabAgent } from '../../../../lib/auth/colab';
import { getProject } from '../../../../lib/kv/projects';
import { createErrorResponse, ErrorCodes } from '../../../../lib/utils/errors';
import { Logger } from '../../../../lib/utils/logger';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    // Validate Colab agent (not user session)
    await validateColabAgent(request, env);
    
    const { projectId } = params;
    
    if (!projectId) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Project ID is required',
        400
      );
    }
    
    Logger.info('Colab requesting project metadata', { projectId });
    
    const project = await getProject(projectId as string, env);
    
    if (!project) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    Logger.info('Returned project metadata to Colab', { projectId });
    
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
    
    Logger.error('Error getting project for Colab', { projectId: params.projectId, error });
    
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
