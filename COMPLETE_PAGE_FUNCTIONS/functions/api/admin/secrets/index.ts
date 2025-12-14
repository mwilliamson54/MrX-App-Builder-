// functions/api/admin/secrets/index.ts
import type { Env } from '../../../../types';
import { validateAdminApiKey } from '../../../../lib/auth/admin';
import { storeSecret } from '../../../../lib/kv/secrets';
import { createErrorResponse, ErrorCodes } from '../../../../lib/utils/errors';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Validate admin credentials
    await validateAdminApiKey(request, env);
    
    const body = await request.json();
    const { type, projectId, value } = body;
    
    if (!type || !projectId || !value) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'type, projectId, and value are required',
        400
      );
    }
    
    const validTypes = ['github', 'drive', 'llm'];
    if (!validTypes.includes(type)) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        `Invalid secret type. Must be one of: ${validTypes.join(', ')}`,
        400
      );
    }
    
    await storeSecret(type, projectId, value, env);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
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
      'Failed to store secret',
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
