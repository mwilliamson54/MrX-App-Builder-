// functions/api/auth/login.ts
import type { Env } from '../../../types';
import { signJWT } from '../../../lib/crypto/jwt';
import { createErrorResponse, ErrorCodes } from '../../../lib/utils/errors';
import { Logger } from '../../../lib/utils/logger';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Username and password are required',
        400
      );
    }
    
    // Validate credentials
    // For now, using hardcoded admin credentials
    // TODO: Replace with database-backed authentication
    const ADMIN_USERNAME = 'MrX';
    const ADMIN_PASSWORD = 'MrX@786'; // Change this to your desired password
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = await signJWT({
        userId: 'admin_user',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        iat: Math.floor(Date.now() / 1000)
      }, env);
      
      Logger.info('User logged in successfully', { username });
      
      return new Response(JSON.stringify({ 
        success: true,
        token,
        user: {
          userId: 'admin_user',
          username,
          role: 'admin'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    Logger.warn('Invalid login attempt', { username });
    
    return createErrorResponse(
      ErrorCodes.UNAUTHORIZED,
      'Invalid username or password',
      401
    );
    
  } catch (error) {
    Logger.error('Login error', { error });
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
