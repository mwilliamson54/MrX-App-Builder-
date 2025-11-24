// lib/crypto/encryption.ts
import type { Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';

export async function encrypt(plaintext: string, env: Env): Promise<{ encrypted: string; iv: string }> {
  try {
    // Convert encryption key to CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.ENCRYPTION_KEY.slice(0, 32)),
      'AES-GCM',
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      new TextEncoder().encode(plaintext)
    );

    // Convert to base64 for storage
    const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { encrypted, iv: ivBase64 };
  } catch (error) {
    throw new AppError(ErrorCodes.ENCRYPTION_FAILED, 'Failed to encrypt data', 500, { error });
  }
}

export async function decrypt(encrypted: string, iv: string, env: Env): Promise<string> {
  try {
    // Convert encryption key to CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.ENCRYPTION_KEY.slice(0, 32)),
      'AES-GCM',
      false,
      ['decrypt']
    );

    // Convert from base64
    const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      keyMaterial,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    throw new AppError(ErrorCodes.ENCRYPTION_FAILED, 'Failed to decrypt data', 500, { error });
  }
}

