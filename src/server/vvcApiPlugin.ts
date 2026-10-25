import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Helper om Firestore REST API document fields om te zetten naar platte JSON
 */
function parseFirestoreFields(fields: Record<string, any> = {}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = Number(val.integerValue);
    else if ('doubleValue' in val) result[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) result[key] = Boolean(val.booleanValue);
    else if ('timestampValue' in val) result[key] = val.timestampValue;
    else if ('arrayValue' in val) {
      result[key] = (val.arrayValue?.values || []).map((v: any) =>
        v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? v
      );
    } else if ('mapValue' in val) {
      result[key] = parseFirestoreFields(val.mapValue?.fields || {});
    }
  }
  return result;
}

/**
 * CRMos - VVC REST API Plugin
 * Maakt het mogelijk voor het VVC Ecosysteem om aanmeldingen via een unieke VVC tag (`vvc-xxx`)
 * op te halen via:
 * - GET /api/vvc/lookup?tag=vvc-xxx
 * - GET /api/v1/contacts?tag=vvc-xxx
 */
export function vvcApiPlugin(): Plugin {
  return {
    name: 'crmos-vvc-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlStr = req.url || '';
        if (
          !urlStr.startsWith('/api/vvc') &&
          !urlStr.startsWith('/api/v1/contacts')
        ) {
          return next();
        }

        // CORS headers zodat VVC vanuit elk domein gegevens kan ophalen
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-VVC-Token');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          const parsedUrl = new URL(urlStr, 'http://localhost');
          let tag =
            parsedUrl.searchParams.get('tag') ||
            parsedUrl.searchParams.get('vvc_tag') ||
            parsedUrl.searchParams.get('code') ||
            '';

          if (!tag && parsedUrl.pathname.startsWith('/api/vvc/')) {
            const seg = parsedUrl.pathname.replace('/api/vvc/', '').trim();
            if (seg && seg !== 'lookup') {
              tag = decodeURIComponent(seg);
            }
          }

          if (!tag) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                message: 'Geef een geldige unieke VVC tag mee via ?tag=vvc-xxx',
              })
            );
            return;
          }

          const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';
          const collectionsToTry = ['vvc_sync_codes', 'crm_vvc_registry'];

          for (const colName of collectionsToTry) {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}/${encodeURIComponent(
              tag.trim()
            )}`;
            const fbRes = await fetch(firestoreUrl);
            if (fbRes.ok) {
              const docJson = (await fbRes.json()) as { fields?: Record<string, any> };
              const flatData = parseFirestoreFields(docJson.fields || {});
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  vvc_tag: tag.trim(),
                  collection: colName,
                  data: flatData,
                })
              );
              return;
            }
          }

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              vvc_tag: tag.trim(),
              message: `Geen aanmelding gevonden in CRMos voor tag "${tag.trim()}"`,
            })
          );
        } catch (err: unknown) {
          const msg = (err as Error)?.message || 'Fout bij ophalen van VVC aanmelding via API';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: msg }));
        }
      });
    },
  };
}
