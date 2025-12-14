// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mrx-app-builder.pages.dev';
export const POLL_INTERVAL = 3000; // 3 seconds
export const LOG_BATCH_SIZE = 50;
export const MESSAGE_BATCH_SIZE = 20;

// Theme options
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

// Message sender types
export const MESSAGE_SENDERS = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

// Job states
export const JOB_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

// LLM modes
export const LLM_MODES = {
  CUSTOM: 'custom',
  OPENAI: 'openai'
};
