// functions/api/admin/secrets/[projectId].ts
import { validateColabClaimToken } from '../../../../lib/auth/colab';
import { retrieveSecret } from '../../../../lib/kv/secrets';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    // Get Colab ID from header
    const colabId = request.headers.get('X-Colab-Id');
    
    if (!colabId) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Colab ID required',
        401
      );
    }
    
    // Validate claim token (one-time use)
    await validateColabClaimToken(request, colabId, env);
    
    const { projectId } = params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'github' | 'drive' | 'llm';
    
    if (!type) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'type query parameter is required',
        400
      );
    }
    
    const secret = await retrieveSecret(type, projectId as string, env);
    
    if (!secret) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Secret not found for project ${projectId}`,
        404
      );
    }
    
    return new Response(JSON.stringify({ secret }), {
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
      'Failed to retrieve secret',
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