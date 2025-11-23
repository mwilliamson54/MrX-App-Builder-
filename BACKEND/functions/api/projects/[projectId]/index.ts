// functions/api/projects/[projectId]/index.ts
import { getProject } from '../../../../lib/kv/projects';

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

