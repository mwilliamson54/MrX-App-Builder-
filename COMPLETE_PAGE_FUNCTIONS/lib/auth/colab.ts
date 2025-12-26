// lib/auth/colab.ts
import type { Env } from '../../types';
import { validateAndUseClaimToken } from '../kv/secrets';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

const COLAB_AGENT_SECRET_HEADER = 'X-Colab-Secret';
const COLAB_CLAIM_TOKEN_HEADER = 'X-Claim-Token';
const COLAB_ID_HEADER = 'X-Colab-Id';

export async function validateColabAgent(request: Request, env: Env): Promise<string> {
  const colabSecret = request.headers.get(COLAB_AGENT_SECRET_HEADER);
  const colabId = request.headers.get(COLAB_ID_HEADER);
  
  if (!colabSecret) {
    Logger.warn('Missing Colab agent secret header');
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Colab agent credentials', 401);
  }

  if (!colabId) {
    Logger.warn('Missing Colab ID header');
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Colab ID', 401);
  }

  // Verify shared secret for Colab agent
  if (!env.COLAB_AGENT_SECRET || colabSecret !== env.COLAB_AGENT_SECRET) {
    Logger.warn('Invalid Colab agent secret', { colabId });
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid Colab agent credentials', 401);
  }
  
  Logger.info('✅ Colab agent authenticated', { colabId });
  return colabId;
}

export async function validateColabClaimToken(
  request: Request,
  colabId: string,
  env: Env
): Promise<void> {
  const claimToken = request.headers.get(COLAB_CLAIM_TOKEN_HEADER);
  
  if (!claimToken) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing claim token', 401);
  }
  
  const isValid = await validateAndUseClaimToken(claimToken, colabId, env);
  
  if (!isValid) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid or expired claim token', 401);
  }
  
  Logger.info('✅ Claim token validated', { colabId });
}
