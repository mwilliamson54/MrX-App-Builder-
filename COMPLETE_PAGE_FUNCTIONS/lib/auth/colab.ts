// lib/auth/colab.ts
import type { Env } from '../../types';
import { validateAndUseClaimToken } from '../kv/secrets';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';

const COLAB_AGENT_SECRET_HEADER = 'X-Colab-Secret';
const COLAB_CLAIM_TOKEN_HEADER = 'X-Claim-Token';

export async function validateColabAgent(request: Request, env: Env): Promise<string> {
  const colabSecret = request.headers.get(COLAB_AGENT_SECRET_HEADER);
  
  if (!colabSecret) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Colab agent credentials', 401);
  }

  // Verify shared secret for Colab agent.
  // In a more advanced setup, you could store multiple agents in KV
  // and validate per-agent secrets. For now we use a single env secret.
  if (!env.COLAB_AGENT_SECRET || colabSecret !== env.COLAB_AGENT_SECRET) {
    Logger.warn('Invalid Colab agent secret');
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid Colab agent credentials', 401);
  }

  const colabId = request.headers.get('X-Colab-Id');
  if (!colabId) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Colab ID', 401);
  }
  
  Logger.info('Colab agent authenticated', { colabId });
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
  
  Logger.info('Claim token validated', { colabId });
}
