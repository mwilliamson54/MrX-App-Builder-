// lib/utils/generators.ts
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function generateJobId(): string {
  return generateId('job');
}

export function generateChatId(): string {
  return generateId('chat');
}

export function generateMessageId(): string {
  return generateId('msg');
}

export function generateArtifactId(): string {
  return generateId('artifact');
}

