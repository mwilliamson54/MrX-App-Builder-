// lib/kv/messages.ts
import type { Message, Env, PaginatedResponse } from '../../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { toISOString } from '../utils/dates';
import { generateMessageId } from '../utils/generators';
import { createPaginatedResponse, parseCursor } from '../utils/pagination';

const MESSAGES_PER_SEGMENT = 100;
const MAX_MESSAGES_PER_REQUEST = 50;

function getMessagesKey(projectId: string, chatId: string, segment: number): string {
  return `project:${projectId}:chat:${chatId}:messages:${segment}`;
}

export async function getMessages(
  projectId: string,
  chatId: string,
  cursor: string | null,
  env: Env
): Promise<PaginatedResponse<Message>> {
  try {
    const startIndex = parseCursor(cursor);
    const messages: Message[] = [];
    
    // Calculate which segment to start from
    let currentSegment = Math.floor(startIndex / MESSAGES_PER_SEGMENT);
    let messagesCollected = 0;
    let indexInSegment = startIndex % MESSAGES_PER_SEGMENT;
    
    // Fetch messages across segments until we have enough
    while (messagesCollected < MAX_MESSAGES_PER_REQUEST) {
      const key = getMessagesKey(projectId, chatId, currentSegment);
      const segmentData = await env.KV.get(key, { type: 'json' });
      
      if (!segmentData || !Array.isArray(segmentData)) {
        // No more segments
        break;
      }
      
      const segment = segmentData as Message[];
      
      // Take messages from this segment
      const messagesToTake = Math.min(
        MAX_MESSAGES_PER_REQUEST - messagesCollected,
        segment.length - indexInSegment
      );
      
      messages.push(...segment.slice(indexInSegment, indexInSegment + messagesToTake));
      messagesCollected += messagesToTake;
      
      // Reset index for next segment
      indexInSegment = 0;
      currentSegment++;
      
      // If we didn't get all messages from this segment, there are no more
      if (messagesToTake < segment.length - indexInSegment) {
        break;
      }
    }
    
    const nextCursor = startIndex + messages.length;
    const hasMore = messagesCollected === MAX_MESSAGES_PER_REQUEST;
    
    Logger.info('Retrieved messages', { 
      projectId, 
      chatId, 
      count: messages.length,
      startIndex,
      nextCursor 
    });
    
    return createPaginatedResponse(
      messages,
      hasMore ? nextCursor.toString() : undefined,
      hasMore
    );
  } catch (error) {
    Logger.error('Failed to get messages', { projectId, chatId, error });
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to get messages', 500);
  }
}

export async function addMessage(
  projectId: string,
  chatId: string,
  messageData: { role: 'user' | 'assistant' | 'system'; content: string; metadata?: Record<string, any> },
  env: Env
): Promise<Message> {
  try {
    const message: Message = {
      messageId: generateMessageId(),
      chatId,
      role: messageData.role,
      content: messageData.content,
      timestamp: toISOString(),
      metadata: messageData.metadata
    };
    
    // Find the current segment by counting messages
    let currentSegment = 0;
    let totalMessages = 0;
    
    while (true) {
      const key = getMessagesKey(projectId, chatId, currentSegment);
      const segmentData = await env.KV.get(key, { type: 'json' });
      
      if (!segmentData) {
        // This is a new segment
        await env.KV.put(key, JSON.stringify([message]));
        break;
      }
      
      const segment = segmentData as Message[];
      totalMessages += segment.length;
      
      if (segment.length < MESSAGES_PER_SEGMENT) {
        // Add to this segment
        segment.push(message);
        await env.KV.put(key, JSON.stringify(segment));
        break;
      }
      
      // Move to next segment
      currentSegment++;
    }
    
    Logger.info('Added message', { 
      projectId, 
      chatId, 
      messageId: message.messageId,
      segment: currentSegment 
    });
    
    return message;
  } catch (error) {
    Logger.error('Failed to add message', { projectId, chatId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to add message', 500);
  }
}

export async function getMessageCount(
  projectId: string,
  chatId: string,
  env: Env
): Promise<number> {
  try {
    let totalCount = 0;
    let segment = 0;
    
    while (true) {
      const key = getMessagesKey(projectId, chatId, segment);
      const segmentData = await env.KV.get(key, { type: 'json' });
      
      if (!segmentData || !Array.isArray(segmentData)) {
        break;
      }
      
      totalCount += (segmentData as Message[]).length;
      segment++;
    }
    
    return totalCount;
  } catch (error) {
    Logger.error('Failed to count messages', { projectId, chatId, error });
    return 0;
  }
}

export async function clearMessages(
  projectId: string,
  chatId: string,
  env: Env
): Promise<void> {
  try {
    const prefix = `project:${projectId}:chat:${chatId}:messages:`;
    const { keys } = await env.KV.list({ prefix });
    
    for (const key of keys) {
      await env.KV.delete(key.name);
    }
    
    // Initialize with empty first segment
    await env.KV.put(getMessagesKey(projectId, chatId, 0), JSON.stringify([]));
    
    Logger.info('Cleared messages', { projectId, chatId });
  } catch (error) {
    Logger.error('Failed to clear messages', { projectId, chatId, error });
    throw new AppError(ErrorCodes.KV_WRITE_FAILED, 'Failed to clear messages', 500);
  }
}