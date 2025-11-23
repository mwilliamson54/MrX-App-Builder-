// lib/kv/chats.ts
import type { Chat, Message, Env } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { toISOString } from '../utils/dates';
import { generateChatId, generateMessageId } from '../utils/generators';

function getChatKey(projectId: string, chatId: string): string {
  return `project:${projectId}:chat:${chatId}:meta`;
}

function getMessagesKey(projectId: string, chatId: string, segment: number = 0): string {
  return `project:${projectId}:chat:${chatId}:messages:${segment}`;
}

export async function listChats(projectId: string, env: Env): Promise<Chat[]> {
  try {
    const prefix = `project:${projectId}:chat:`;
    const { keys } = await env.KV.list({ prefix });
    
    const chats: Chat[] = [];
    
    for (const key of keys) {
      if (key.name.endsWith(':meta')) {
        const chatData = await env.KV.get(key.name, { type: 'json' });
        if (chatData) {
          chats.push(chatData as Chat);
        }
      }
    }
    
    // Sort by updatedAt descending
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    Logger.info('Listed chats', { projectId, count: chats.length });
    return chats;
  } catch (error) {
    Logger.error('Failed to list chats', { projectId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to list chats', 500);
  }
}

export async function getChat(projectId: string, chatId: string, env: Env): Promise<Chat | null> {
  try {
    const key = getChatKey(projectId, chatId);
    const chat = await env.KV.get(key, { type: 'json' });
    
    if (!chat) {
      Logger.warn('Chat not found', { projectId, chatId });
      return null;
    }
    
    return chat as Chat;
  } catch (error) {
    Logger.error('Failed to get chat', { projectId, chatId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get chat', 500);
  }
}

export async function createChat(
  projectId: string,
  data: { title: string; llmMode?: 'custom' | 'openai' },
  env: Env
): Promise<Chat> {
  try {
    const now = toISOString();
    const chatId = generateChatId();
    
    const chat: Chat = {
      chatId,
      projectId,
      title: data.title,
      llmMode: data.llmMode || 'custom',
      createdAt: now,
      updatedAt: now
    };
    
    const key = getChatKey(projectId, chatId);
    await env.KV.put(key, JSON.stringify(chat));
    
    // Initialize empty messages array
    const messagesKey = getMessagesKey(projectId, chatId, 0);
    await env.KV.put(messagesKey, JSON.stringify([]));
    
    Logger.info('Created chat', { projectId, chatId });
    return chat;
  } catch (error) {
    Logger.error('Failed to create chat', { projectId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to create chat', 500);
  }
}

export async function updateChat(
  projectId: string,
  chatId: string,
  updates: Partial<Omit<Chat, 'chatId' | 'projectId' | 'createdAt' | 'updatedAt'>>,
  env: Env
): Promise<Chat> {
  try {
    const existing = await getChat(projectId, chatId, env);
    
    if (!existing) {
      throw new AppError(ErrorCodes.CHAT_NOT_FOUND, `Chat ${chatId} not found`, 404);
    }
    
    const updated: Chat = {
      ...existing,
      ...updates,
      updatedAt: toISOString()
    };
    
    const key = getChatKey(projectId, chatId);
    await env.KV.put(key, JSON.stringify(updated));
    
    Logger.info('Updated chat', { projectId, chatId });
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    Logger.error('Failed to update chat', { projectId, chatId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to update chat', 500);
  }
}

export async function deleteChat(projectId: string, chatId: string, env: Env): Promise<void> {
  try {
    // Delete chat metadata
    const key = getChatKey(projectId, chatId);
    await env.KV.delete(key);
    
    // Delete all message segments
    // In production, this should be a background cleanup job
    const messagesPrefix = `project:${projectId}:chat:${chatId}:messages:`;
    const { keys } = await env.KV.list({ prefix: messagesPrefix });
    
    for (const key of keys) {
      await env.KV.delete(key.name);
    }
    
    Logger.info('Deleted chat', { projectId, chatId });
  } catch (error) {
    Logger.error('Failed to delete chat', { projectId, chatId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to delete chat', 500);
  }
}

export async function chatExists(projectId: string, chatId: string, env: Env): Promise<boolean> {
  const chat = await getChat(projectId, chatId, env);
  return chat !== null;
}