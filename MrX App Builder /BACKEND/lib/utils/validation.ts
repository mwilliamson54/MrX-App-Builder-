// lib/utils/validation.ts
export function isValidProjectId(projectId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(projectId) && projectId.length > 0 && projectId.length <= 100;
}

export function isValidChatId(chatId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(chatId) && chatId.length > 0;
}

export function isValidJobId(jobId: string): boolean {
  return /^job_[0-9]+_[a-zA-Z0-9]+$/.test(jobId);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>'"]/g, '');
}

