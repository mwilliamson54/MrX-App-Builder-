// functions/api/jobs/claim.ts
import { validateColabAgent } from '../../../lib/auth/colab';
import { claimJob } from '../../../lib/kv/jobs';
import { createClaimTokenForColab } from '../../../lib/kv/secrets';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Validate Colab agent credentials
    const colabId = await validateColabAgent(request, env);
    
    // Try to claim a job
    const job = await claimJob(colabId, env);
    
    if (!job) {
      // No jobs available
      return new Response(JSON.stringify({ job: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate claim token for secret retrieval
    const claimToken = await createClaimTokenForColab(colabId, env);
    
    return new Response(JSON.stringify({ job, claimToken }), {
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
      'Failed to claim job',
      500
    );
  }
};

