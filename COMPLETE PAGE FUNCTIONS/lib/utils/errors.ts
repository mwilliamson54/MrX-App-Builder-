// lib/utils/errors.ts
import type { APIError } from '../../types';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): Response {
  const error: APIError = {
    error: true,
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(error), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const ErrorCodes = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_ALREADY_CLAIMED: 'JOB_ALREADY_CLAIMED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  KV_WRITE_FAILED: 'KV_WRITE_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

