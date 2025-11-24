// lib/auth/cors.ts
export function getCorsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.DASHBOARD_URL,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Colab-Secret, X-Colab-Id, X-Claim-Token, X-Admin-Api-Key',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export function handleCorsPrelight(env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(env)
  });
}

export function addCorsHeaders(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(env);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}