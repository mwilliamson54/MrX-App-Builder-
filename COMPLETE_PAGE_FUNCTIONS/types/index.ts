// types/index.ts
// Core type definitions for MrX App Builder Platform

export interface Project {
  projectId: string;
  name: string;
  repo: string;
  defaultBranch: string;
  driveFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  chatId: string;
  projectId: string;
  title: string;
  llmMode: 'custom' | 'openai';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  messageId: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Job {
  jobId: string;
  projectId: string;
  type: 'chat' | 'patch' | 'build' | 'index-rebuild';
  state: 'pending' | 'claimed' | 'running' | 'failed' | 'completed';
  payload: Record<string, any>;
  claimedBy: string | null;
  claimExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface LogSegment {
  segment: number;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export interface Artifact {
  artifactId: string;
  projectId: string;
  drivePath: string;
  fileName: string;
  sha256: string;
  buildNumber: string;
  size: number;
  uploadedAt: string;
}

export interface SecretMetadata {
  type: 'github' | 'drive' | 'llm';
  projectId: string;
  encrypted: string;
  iv: string;
  createdAt: string;
  rotatedAt?: string;
}

export interface ClaimToken {
  token: string;
  colabId: string;
  expiresAt: string;
  used: boolean;
}

export interface APIError {
  error: true;
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string | number;
  hasMore: boolean;
  total?: number;
}

export interface SessionToken {
  userId: string;
  role: 'user' | 'admin';
  exp: number;
  iat: number;
}

export interface KVNamespace {
  get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor?: string }>;
}

export interface Env {
  KV: KVNamespace;
  DASHBOARD_URL: string;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
  GITHUB_PAT_MASTER: string;
  ADMIN_API_KEY: string;
  // Admin login (single admin user for now)
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  // Shared secret for Colab agent authentication
  COLAB_AGENT_SECRET: string;
}

export interface RequestContext {
  env: Env;
  request: Request;
  userId?: string;
  role?: string;
}