// functions/api/colab/authenticate.ts
import type { Env } from '../../../types';
import { createErrorResponse, ErrorCodes } from '../../../lib/utils/errors';
import { Logger } from '../../../lib/utils/logger';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { colabId, claimSecret } = body;
    
    if (!colabId || !claimSecret) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'colabId and claimSecret are required',
        400
      );
    }
    
    // Verify the claim secret matches the environment variable
    if (claimSecret !== env.COLAB_AGENT_SECRET) {
      Logger.warn('Invalid Colab claim secret', { colabId });
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Invalid claim secret',
        401
      );
    }
    
    Logger.info('Colab authenticated successfully', { colabId });
    
    // Return success with optional session data
    return new Response(JSON.stringify({
      success: true,
      colabId,
      message: 'Authentication successful'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    Logger.error('Colab authentication error', { error });
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Authentication failed',
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
