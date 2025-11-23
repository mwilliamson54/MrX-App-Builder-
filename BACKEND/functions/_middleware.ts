// functions/_middleware.ts
import type { Env } from '../types';
import { handleCorsPrelight, addCorsHeaders } from '../lib/auth/cors';
import { createErrorResponse, ErrorCodes } from '../lib/utils/errors';
import { Logger } from '../lib/utils/logger';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // Log incoming request
  Logger.info('Incoming request', {
    method: request.method,
    path: url.pathname,
    origin: request.headers.get('Origin')
  });
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPrelight(env);
  }
  
  // Verify origin for non-OPTIONS requests
  const origin = request.headers.get('Origin');
  if (origin && origin !== env.DASHBOARD_URL) {
    // Allow Colab requests (they may not have origin header)
    const isColabRequest = request.headers.has('X-Colab-Secret');
    
    if (!isColabRequest) {
      Logger.warn('Blocked request from unauthorized origin', { origin });
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Unauthorized origin',
        403
      );
    }
  }
  
  try {
    // Continue to route handler
    const response = await next();
    
    // Add CORS headers to response
    const corsResponse = addCorsHeaders(response, env);
    
    // Log response
    Logger.info('Request completed', {
      method: request.method,
      path: url.pathname,
      status: corsResponse.status
    });
    
    return corsResponse;
  } catch (error) {
    // Global error handler
    Logger.error('Unhandled error in request', {
      method: request.method,
      path: url.pathname,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return generic error response
    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An internal error occurred',
      500
    );
    
    return addCorsHeaders(errorResponse, env);
  }
};

// Type definition for Cloudflare Pages Functions
interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
  }): Promise<Response> | Response;
}