// lib/kv/secrets.ts
import type { SecretMetadata, ClaimToken, Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { toISOString, addMinutes, isExpired } from '../utils/dates';
import { encrypt, decrypt } from '../crypto/encryption';
import { generateClaimToken, hashToken, verifyToken } from '../crypto/tokens';

function getSecretKey(type: 'github' | 'drive' | 'llm', projectId: string): string {
  return `secret:${type}:${projectId}`;
}

function getClaimTokenKey(tokenHash: string): string {
  return `claimtoken:${tokenHash}`;
}

export async function storeSecret(
  type: 'github' | 'drive' | 'llm',
  projectId: string,
  value: string,
  env: Env
): Promise<void> {
  try {
    // Encrypt the secret
    const { encrypted, iv } = await encrypt(value, env);
    
    const metadata: SecretMetadata = {
      type,
      projectId,
      encrypted,
      iv,
      createdAt: toISOString()
    };
    
    const key = getSecretKey(type, projectId);
    await env.KV.put(key, JSON.stringify(metadata));
    
    Logger.info('Stored secret', { type, projectId });
  } catch (error) {
    Logger.error('Failed to store secret', { type, projectId, error });
    throw new AppError(ErrorCodes.ENCRYPTION_FAILED, 'Failed to store secret', 500);
  }
}

export async function retrieveSecret(
  type: 'github' | 'drive' | 'llm',
  projectId: string,
  env: Env
): Promise<string | null> {
  try {
    const key = getSecretKey(type, projectId);
    const metadata = await env.KV.get(key, { type: 'json' }) as SecretMetadata;
    
    if (!metadata) {
      Logger.warn('Secret not found', { type, projectId });
      return null;
    }
    
    // Decrypt the secret
    const decrypted = await decrypt(metadata.encrypted, metadata.iv, env);
    
    Logger.info('Retrieved secret', { type, projectId });
    return decrypted;
  } catch (error) {
    Logger.error('Failed to retrieve secret', { type, projectId, error });
    throw new AppError(ErrorCodes.ENCRYPTION_FAILED, 'Failed to retrieve secret', 500);
  }
}

export async function rotateSecret(
  type: 'github' | 'drive' | 'llm',
  projectId: string,
  newValue: string,
  env: Env
): Promise<void> {
  try {
    // Get existing metadata
    const key = getSecretKey(type, projectId);
    const existing = await env.KV.get(key, { type: 'json' }) as SecretMetadata;
    
    // Encrypt new value
    const { encrypted, iv } = await encrypt(newValue, env);
    
    const metadata: SecretMetadata = {
      type,
      projectId,
      encrypted,
      iv,
      createdAt: existing?.createdAt || toISOString(),
      rotatedAt: toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(metadata));
    
    Logger.info('Rotated secret', { type, projectId });
  } catch (error) {
    Logger.error('Failed to rotate secret', { type, projectId, error });
    throw new AppError(ErrorCodes.ENCRYPTION_FAILED, 'Failed to rotate secret', 500);
  }
}

export async function deleteSecret(
  type: 'github' | 'drive' | 'llm',
  projectId: string,
  env: Env
): Promise<void> {
  try {
    const key = getSecretKey(type, projectId);
    await env.KV.delete(key);
    
    Logger.info('Deleted secret', { type, projectId });
  } catch (error) {
    Logger.error('Failed to delete secret', { type, projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to delete secret', 500);
  }
}

export async function createClaimTokenForColab(
  colabId: string,
  env: Env
): Promise<string> {
  try {
    const token = generateClaimToken();
    const tokenHash = await hashToken(token);
    
    const claimToken: ClaimToken = {
      token: tokenHash,
      colabId,
      expiresAt: addMinutes(new Date(), 5).toISOString(),
      used: false
    };
    
    const key = getClaimTokenKey(tokenHash);
    await env.KV.put(key, JSON.stringify(claimToken), {
      expirationTtl: 300 // 5 minutes
    });
    
    Logger.info('Created claim token', { colabId });
    
    // Return the unhashed token to be sent to Colab
    return token;
  } catch (error) {
    Logger.error('Failed to create claim token', { colabId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to create claim token', 500);
  }
}

export async function validateAndUseClaimToken(
  token: string,
  colabId: string,
  env: Env
): Promise<boolean> {
  try {
    const tokenHash = await hashToken(token);
    const key = getClaimTokenKey(tokenHash);
    
    const claimToken = await env.KV.get(key, { type: 'json' }) as ClaimToken;
    
    if (!claimToken) {
      Logger.warn('Claim token not found', { colabId });
      return false;
    }
    
    // Verify it matches the colabId
    if (claimToken.colabId !== colabId) {
      Logger.warn('Claim token colabId mismatch', { colabId, expected: claimToken.colabId });
      return false;
    }
    
    // Check if already used
    if (claimToken.used) {
      Logger.warn('Claim token already used', { colabId });
      return false;
    }
    
    // Check if expired
    if (isExpired(claimToken.expiresAt)) {
      Logger.warn('Claim token expired', { colabId });
      return false;
    }
    
    // Mark as used
    claimToken.used = true;
    await env.KV.put(key, JSON.stringify(claimToken), {
      expirationTtl: 60 // Keep for 1 minute for audit
    });
    
    Logger.info('Validated and used claim token', { colabId });
    return true;
  } catch (error) {
    Logger.error('Failed to validate claim token', { colabId, error });
    return false;
  }
}

export async function revokeClaimToken(token: string, env: Env): Promise<void> {
  try {
    const tokenHash = await hashToken(token);
    const key = getClaimTokenKey(tokenHash);
    await env.KV.delete(key);
    
    Logger.info('Revoked claim token');
  } catch (error) {
    Logger.error('Failed to revoke claim token', { error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to revoke claim token', 500);
  }
}