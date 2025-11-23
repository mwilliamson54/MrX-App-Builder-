// functions/api/projects/[projectId]/chats/[chatId]/messages/index.ts
import type { Env } from '../../../../../../../types';
import { requireAuth } from '../../../../../../../lib/auth/session';
import { chatExists } from '../../../../../../../lib/kv/chats';
import { getMessages, addMessage } from '../../../../../../../lib/kv/messages';
import { createJob } from '../../../../../../../lib/kv/jobs';
import { createErrorResponse, ErrorCodes } from '../../../../../../../lib/utils/errors';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId, chatId } = params;
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    
    if (!chatId || !(await chatExists(projectId as string, chatId as string, env))) {
      return createErrorResponse(
        ErrorCodes.CHAT_NOT_FOUND,
        `Chat ${chatId} not found`,
        404
      );
    }
    
    const messages = await getMessages(
      projectId as string,
      chatId as string,
      cursor,
      env
    );
    
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to get messages',
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    await requireAuth(request, env);
    
    const { projectId, chatId } = params;
    
    if (!chatId || !(await chatExists(projectId as string, chatId as string, env))) {
      return createErrorResponse(
        ErrorCodes.CHAT_NOT_FOUND,
        `Chat ${chatId} not found`,
        404
      );
    }
    
    const body = await request.json();
    const { content, role = 'user', metadata } = body;
    
    if (!content) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'Message content is required',
        400
      );
    }
    
    // Add message
    const message = await addMessage(
      projectId as string,
      chatId as string,
      { role, content, metadata },
      env
    );
    
    // Create job for chat generation (AI response)
    const job = await createJob(
      projectId as string,
      {
        type: 'chat',
        payload: {
          chatId,
          messageId: message.messageId
        }
      },
      env
    );
    
    return new Response(JSON.stringify({ message, jobId: job.jobId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to add message',
      500
    );
  }
};

