// functions/api/projects/index.ts
import type { Env } from '../../../types';
import { requireAuth } from '../../../lib/auth/session';
import { listMrxRepositories } from '../../../lib/github/repos';
import { createErrorResponse, ErrorCodes } from '../../../lib/utils/errors';

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

