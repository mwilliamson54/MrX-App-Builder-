// functions/api/projects/[projectId]/artifacts/index.ts
import type { Env } from '../../../../../types';
import { requireAuth } from '../../../../../lib/auth/session';
import { projectExists } from '../../../../../lib/kv/projects';
import { listArtifacts } from '../../../../../lib/kv/artifacts';
import { createErrorResponse, ErrorCodes } from '../../../../../lib/utils/errors';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId } = params;
    
    if (!projectId || !(await projectExists(projectId as string, env))) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    const artifacts = await listArtifacts(projectId as string, env);
    
    return new Response(JSON.stringify(artifacts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to list artifacts',
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
