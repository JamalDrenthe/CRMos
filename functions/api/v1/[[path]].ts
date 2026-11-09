import { handleCrmosApiRequest } from '../../../src/server/crmosApiCore';

export const onRequest = async (context: {
  request: Request;
  env?: Record<string, any>;
}): Promise<Response> => {
  const { request, env } = context;
  const method = request.method || 'GET';

  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let bodyText = '';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try {
      bodyText = await request.text();
    } catch {
      bodyText = '';
    }
  }

  const coreRes = await handleCrmosApiRequest({
    method,
    url: request.url,
    headers,
    bodyText,
    projectId: env?.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev',
  });

  return new Response(coreRes.status === 204 ? null : coreRes.body, {
    status: coreRes.status,
    headers: coreRes.headers,
  });
};
