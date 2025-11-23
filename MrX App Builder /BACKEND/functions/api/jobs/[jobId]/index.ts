// functions/api/jobs/[jobId]/index.ts
import { validateColabAgent } from '../../../../lib/auth/colab';
import { updateJobState, getJob } from '../../../../lib/kv/jobs';

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    // Validate Colab agent
    await validateColabAgent(request, env);
    
    const { jobId } = params;
    const body = await request.json();
    const { state, payload, error } = body;
    
    if (!state) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'State is required',
        400
      );
    }
    
    // Find the job across all projects
    const { keys } = await env.KV.list({ prefix: 'project:' });
    let projectId: string | null = null;
    
    for (const key of keys) {
      if (key.name.includes(`:job:${jobId}`)) {
        const match = key.name.match(/^project:([^:]+):/);
        if (match) {
          projectId = match[1];
          break;
        }
      }
    }
    
    if (!projectId) {
      return createErrorResponse(
        ErrorCodes.JOB_NOT_FOUND,
        `Job ${jobId} not found`,
        404
      );
    }
    
    const job = await updateJobState(
      projectId,
      jobId as string,
      state,
      { payload, error },
      env
    );
    
    return new Response(JSON.stringify(job), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      return createErrorResponse(
        (error as any).code,
        error.message,
        (error as any).statusCode
      );
    }
    
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update job',
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