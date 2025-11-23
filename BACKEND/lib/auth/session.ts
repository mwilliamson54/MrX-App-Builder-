// lib/auth/session.ts
import type { SessionToken, Env } from '../../types';
import { verifyJWT } from '../crypto/jwt';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

export async function validateSessionToken(
  authHeader: string | null,
  env: Env
): Promise<SessionToken> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing or invalid authorization header', 401);
  }
  
  const token = authHeader.substring(7);
  
  const session = await verifyJWT(token, env);
  
  if (!session) {
    Logger.warn('Invalid or expired session token');
    throw new AppError(ErrorCodes.INVALID_TOKEN, 'Invalid or expired token', 401);
  }
  
  return session;
}

export async function requireAuth(request: Request, env: Env): Promise<SessionToken> {
  const authHeader = request.headers.get('Authorization');
  return validateSessionToken(authHeader, env);
}

