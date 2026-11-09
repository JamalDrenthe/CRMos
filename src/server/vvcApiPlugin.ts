import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { PREDEFINED_COMPANY_API_KEYS } from '../data/apiKeysData';
import { handleCrmosApiRequest } from './crmosApiCore';

export { PREDEFINED_COMPANY_API_KEYS };

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', (err) => reject(err));
  });
}

/**
 * CRMos Universal REST API Engine — Vite Dev Middleware (gebruikt exact dezelfde core als Cloudflare Pages Functions)
 */
export function vvcApiPlugin(): Plugin {
  return {
    name: 'crmos-universal-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlStr = req.url || '';
        if (
          !urlStr.startsWith('/api/vvc') &&
          !urlStr.startsWith('/api/v1') &&
          urlStr !== '/api/health'
        ) {
          return next();
        }

        const method = (req.method || 'GET').toUpperCase();
        const headers: Record<string, string | undefined> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          headers[k] = Array.isArray(v) ? v.join(', ') : v;
        }

        let bodyText = '';
        if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
          try {
            bodyText = await readBody(req);
          } catch {
            bodyText = '';
          }
        }

        const coreRes = await handleCrmosApiRequest({
          method,
          url: `http://localhost${urlStr}`,
          headers,
          bodyText,
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev',
        });

        res.writeHead(coreRes.status, coreRes.headers);
        res.end(coreRes.status === 204 ? undefined : coreRes.body);
      });
    },
  };
}
