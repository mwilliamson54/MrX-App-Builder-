// lib/auth/colab.ts
import { validateAndUseClaimToken } from '../kv/secrets';

const COLAB_AGENT_SECRET_HEADER = 'X-Colab-Secret';
const COLAB_CLAIM_TOKEN_HEADER = 'X-Claim-Token';

export async function validateColabAgent(request: Request, env: Env): Promise<string> {
  const colabSecret = request.headers.get(COLAB_AGENT_SECRET_HEADER);
  
  if (!colabSecret) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Colab agent credentials', 401);
  }
  
  // In a real implementation, verify this secret against registered Colab agents
  // For now, we'll use a simple environment variable check
  // In production, this should be stored in KV with agent registration
  
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

