// lib/auth/admin.ts
import type { Env } from '../../types';
import { requireAuth } from './session';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

export async function requireAdmin(request: Request, env: Env): Promise<void> {
  // First validate session
  const session = await requireAuth(request, env);
  
  // Check if user has admin role
  if (session.role !== 'admin') {
    Logger.warn('Non-admin user attempted admin action', { userId: session.userId });
    throw new AppError(ErrorCodes.FORBIDDEN, 'Admin access required', 403);
  }
  
  Logger.info('Admin access granted', { userId: session.userId });
}

export async function validateAdminApiKey(request: Request, env: Env): Promise<void> {
  const apiKey = request.headers.get('X-Admin-Api-Key');
  
  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    Logger.warn('Invalid admin API key');
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid admin API key', 401);
  }
}
