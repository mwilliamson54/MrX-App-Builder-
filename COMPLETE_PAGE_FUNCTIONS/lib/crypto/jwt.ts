// lib/crypto/jwt.ts
import type { SessionToken, Env } from '../../types';

export async function signJWT(payload: SessionToken, env: Env): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    new TextEncoder().encode(data)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, env: Env): Promise<SessionToken | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      keyMaterial,
      signatureBuffer,
      new TextEncoder().encode(data)
    );
    
    if (!isValid) return null;
    
    const payload: SessionToken = JSON.parse(atob(encodedPayload));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}