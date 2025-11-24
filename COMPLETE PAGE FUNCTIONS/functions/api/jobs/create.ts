// functions/api/jobs/create.ts
import { requireAuth } from '../../../lib/auth/session';
import { createJob } from '../../../lib/kv/jobs';
import { projectExists } from '../../../lib/kv/projects';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    await requireAuth(request, env);
    
    const body = await request.json();
    const { projectId, jobType, payload } = body;
    
    if (!projectId || !jobType || !payload) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        'projectId, jobType, and payload are required',
        400
      );
    }
    
    if (!(await projectExists(projectId, env))) {
      return createErrorResponse(
        ErrorCodes.PROJECT_NOT_FOUND,
        `Project ${projectId} not found`,
        404
      );
    }
    
    const validJobTypes = ['chat', 'patch', 'build', 'index-rebuild'];
    if (!validJobTypes.includes(jobType)) {
      return createErrorResponse(
        ErrorCodes.INVALID_REQUEST,
        `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`,
        400
      );
    }
    
    const job = await createJob(
      projectId,
      { type: jobType, payload },
      env
    );
    
    return new Response(JSON.stringify(job), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create job',
      500
    );
  }
};

