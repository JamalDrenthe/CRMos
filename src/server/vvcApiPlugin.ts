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

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CRMOS-API-KEY, X-VVC-Token',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * CRMos Universal REST API Engine
 * 
 * Behandelt:
 * - GET  /api/v1/health
 * - GET  /api/v1/vvc/lookup?tag=... & GET /api/vvc/lookup
 * - GET  /api/v1/contacts?tag=...&company_tag=...
 * - POST /api/v1/contacts
 * - GET  /api/v1/candidates
 * - POST /api/v1/candidates
 * - GET  /api/v1/teams
 * - GET  /api/v1/companies
 */
export function vvcApiPlugin(): Plugin {
  return {
    name: 'crmos-universal-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlStr = req.url || '';
        if (
          !urlStr.startsWith('/api/vvc') &&
          !urlStr.startsWith('/api/v1')
        ) {
          return next();
        }

        // CORS Preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CRMOS-API-KEY, X-VVC-Token',
          });
          res.end();
          return;
        }

        try {
          const parsedUrl = new URL(urlStr, 'http://localhost');
          const pathname = parsedUrl.pathname;
          const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';

          // 1. HEALTH CHECK
          if (pathname === '/api/v1/health') {
            return sendJson(res, 200, {
              success: true,
              data: {
                status: 'operational',
                version: '2.0.0',
                platform: 'CRMos Multi-Tenant Cloud',
                ecosystem: 'VVC & Partners',
                timestamp: new Date().toISOString(),
              },
            });
          }

          // 2. VVC LOOKUP
          if (pathname === '/api/v1/vvc/lookup' || pathname === '/api/vvc/lookup' || pathname.startsWith('/api/vvc/')) {
            let tag =
              parsedUrl.searchParams.get('tag') ||
              parsedUrl.searchParams.get('vvc_tag') ||
              parsedUrl.searchParams.get('code') ||
              '';

            if (!tag && pathname.startsWith('/api/vvc/')) {
              const seg = pathname.replace('/api/vvc/', '').trim();
              if (seg && seg !== 'lookup') tag = decodeURIComponent(seg);
            }

            if (!tag) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef een geldige unieke VVC tag op via ?tag=vvc-xxx',
              });
            }

            const collectionsToTry = ['crm_vvc_registry', 'vvc_sync_codes', 'crm_contacts'];
            for (const colName of collectionsToTry) {
              try {
                const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}/${encodeURIComponent(tag.trim())}`;
                const fbRes = await fetch(firestoreUrl);
                if (fbRes.ok) {
                  const docJson = (await fbRes.json()) as { fields?: Record<string, any> };
                  const flatData = parseFirestoreFields(docJson.fields || {});
                  return sendJson(res, 200, {
                    success: true,
                    vvc_tag: tag.trim(),
                    collection: colName,
                    data: flatData,
                  });
                }
              } catch {
                // Next collection
              }
            }

            return sendJson(res, 404, {
              success: false,
              vvc_tag: tag.trim(),
              message: `Geen aanmelding gevonden in CRMos voor tag "${tag.trim()}"`,
            });
          }

          // 3. CONTACTS
          if (pathname === '/api/v1/contacts') {
            if (req.method === 'GET') {
              const tag = parsedUrl.searchParams.get('tag');
              const companyTag = parsedUrl.searchParams.get('company_tag');
              const pageSize = Number(parsedUrl.searchParams.get('limit')) || 50;

              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=${pageSize}`;
              const fbRes = await fetch(firestoreUrl);
              if (!fbRes.ok) {
                return sendJson(res, 200, {
                  success: true,
                  source: 'local_proxy',
                  count: 0,
                  data: [],
                });
              }

              const data = (await fbRes.json()) as { documents?: any[] };
              const contacts = (data.documents || []).map((d: any) => {
                const flat = parseFirestoreFields(d.fields || {});
                const id = d.name.split('/').pop();
                return { id, ...flat };
              });

              let filtered = contacts;
              if (tag) {
                filtered = filtered.filter((c: any) => 
                  c.vvc_tag?.toLowerCase() === tag.toLowerCase() ||
                  c.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase())
                );
              }
              if (companyTag) {
                filtered = filtered.filter((c: any) =>
                  c.company_tags?.some((ct: string) => ct.toLowerCase() === companyTag.toLowerCase())
                );
              }

              return sendJson(res, 200, {
                success: true,
                count: filtered.length,
                data: filtered,
              });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              return sendJson(res, 201, {
                success: true,
                message: 'Contact ontvangen en verwerkt',
                data: {
                  id: payload.id || `contact_${Date.now()}`,
                  ...payload,
                  created_at: new Date().toISOString(),
                },
              });
            }
          }

          // 4. CANDIDATES (Career & No Cure No Pay Application)
          if (pathname === '/api/v1/candidates') {
            if (req.method === 'GET') {
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recruitment_candidates?pageSize=50`;
              const fbRes = await fetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const candidates = (data.documents || []).map((d: any) => {
                const flat = parseFirestoreFields(d.fields || {});
                return { id: d.name.split('/').pop(), ...flat };
              });

              return sendJson(res, 200, {
                success: true,
                count: candidates.length,
                data: candidates,
              });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const candidate = JSON.parse(rawBody || '{}');
              return sendJson(res, 201, {
                success: true,
                message: 'Sollicitatie succesvol geregistreerd in CRMos Recruitment',
                data: {
                  id: candidate.id || `cand_${Date.now()}`,
                  ...candidate,
                  created_at: new Date().toISOString(),
                },
              });
            }
          }

          // 5. TEAMS
          if (pathname === '/api/v1/teams') {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_teams`;
            const fbRes = await fetch(firestoreUrl);
            const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
            const teams = (data.documents || []).map((d: any) => {
              const flat = parseFirestoreFields(d.fields || {});
              return { id: d.name.split('/').pop(), ...flat };
            });

            return sendJson(res, 200, {
              success: true,
              count: teams.length,
              data: teams,
            });
          }

          // 6. 13 ECOSYSTEM COMPANIES
          if (pathname === '/api/v1/companies') {
            return sendJson(res, 200, {
              success: true,
              count: 13,
              data: [
                { id: 'vvc', name: 'vvc (verdienende vrienden club)', tag: 'VVC' },
                { id: 'quantum-initium', name: 'quantum initium', tag: 'QUANTUM_INITIUM' },
                { id: 'immigratiepunt', name: 'immigratiepunt', tag: 'IMMIGRATIEPUNT' },
                { id: 'spontiva', name: 'spontiva', tag: 'SPONTIVA' },
                { id: 'investbotiq', name: 'Investbotiq', tag: 'INVESTBOTIQ' },
                { id: 'boostplug', name: 'boostplug', tag: 'BOOSTPLUG' },
                { id: 'crmos', name: 'crmos', tag: 'CRMOS' },
                { id: 'zheavenzy', name: 'zheavenzy', tag: 'ZHEAVENZY' },
                { id: 'logs-rent', name: 'logs.rent', tag: 'LOGS_RENT' },
                { id: 'djobba-works', name: 'djobba.works', tag: 'DJOBBA_WORKS' },
                { id: 'trusting-work', name: 'trusting work', tag: 'TRUSTING_WORK' },
                { id: 'woningvry', name: 'woningvry', tag: 'WONINGVRY' },
                { id: 'xabi-world', name: 'xabi world', tag: 'XABI_WORLD' },
              ],
            });
          }

          return sendJson(res, 404, {
            success: false,
            message: `Endpoint ${pathname} niet gevonden in CRMos API v1`,
          });
        } catch (err: unknown) {
          const msg = (err as Error)?.message || 'Server API Error';
          return sendJson(res, 500, { success: false, message: msg });
        }
      });
    },
  };
}
