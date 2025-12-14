// functions/api/projects/[projectId]/chats/index.ts
import type { Env } from '../../../../../types';
import { requireAuth } from '../../../../../lib/auth/session';
import { listChats, createChat } from '../../../../../lib/kv/chats';
import { addMessage } from '../../../../../lib/kv/messages';
import { createJob } from '../../../../../lib/kv/jobs';
import { projectExists } from '../../../../../lib/kv/projects';
import { createErrorResponse, ErrorCodes } from '../../../../../lib/utils/errors';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId } = params;
    
    if (!projectId || !(await projectExists(projectId as string, env))) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    const chats = await listChats(projectId as string, env);
    
    return new Response(JSON.stringify(chats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to list chats',
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId } = params;
    
    if (!projectId || !(await projectExists(projectId as string, env))) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    const body = await request.json();
    const { title, initialMessage, llmMode } = body;
    
    if (!title) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Chat title is required',
        400
      );
    }
    
    // Create chat
    const chat = await createChat(
      projectId as string,
      { title, llmMode },
      env
    );
    
    let jobId: string | undefined;
    
    // Add initial message if provided
    if (initialMessage) {
      const message = await addMessage(
        projectId as string,
        chat.chatId,
        {
          role: 'user',
          content: initialMessage
        },
        env
      );
      
      // Create job for chat generation
      const job = await createJob(
        projectId as string,
        {
          type: 'chat',
          payload: {
            chatId: chat.chatId,
            messageId: message.messageId
          }
        },
        env
      );
      
      jobId = job.jobId;
    }
    
    return new Response(JSON.stringify({ chat, jobId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create chat',
      500
    );
  }
};

interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
  }): Promise<Response> | Response;
  }
