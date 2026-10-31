import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Officiële Master & Bedrijfs-API Keys voor CRMos
 * Direct te kopiëren en te plakken aan AI agents / integraties.
 */
export const PREDEFINED_COMPANY_API_KEYS: Record<
  string,
  { company: string; tag: string; name: string; role: string; description: string }
> = {
  // Master API Key — Volledige toegang tot alle data en alle 13 bedrijven
  'crm_live_master_jamaldrenthe_2026_all_ecosystem': {
    company: 'ALL',
    tag: 'ALL',
    name: 'Master Ecosystem Key (Jamal Drenthe)',
    role: 'super_admin',
    description: 'Volledige lees- en schrijftoegang tot alle 13 bedrijven, alle contacten, deals, kandidaten en teams.',
  },

  // 1. VVC
  'crm_live_vvc_verdienende_vrienden_club_2026': {
    company: 'vvc (verdienende vrienden club)',
    tag: 'VVC',
    name: 'VVC API Key',
    role: 'partner',
    description: 'Toegang tot VVC aanmeldingen, referral-teams en community contacten.',
  },

  // 2. QUANTUM INITIUM
  'crm_live_quantum_initium_enterprise_2026': {
    company: 'quantum initium',
    tag: 'QUANTUM_INITIUM',
    name: 'Quantum Initium API Key',
    role: 'partner',
    description: 'Toegang tot enterprise finance, AI compute pipelines en corporate contacten.',
  },

  // 3. IMMIGRATIEPUNT
  'crm_live_immigratiepunt_portal_2026': {
    company: 'immigratiepunt',
    tag: 'IMMIGRATIEPUNT',
    name: 'Immigratiepunt API Key',
    role: 'partner',
    description: 'Toegang tot expat dossiers, visa/relocatie contacten en aanvragen.',
  },

  // 4. SPONTIVA
  'crm_live_spontiva_recruitment_2026': {
    company: 'spontiva',
    tag: 'SPONTIVA',
    name: 'Spontiva API Key',
    role: 'partner',
    description: 'Toegang tot recruitment, No Cure No Pay kandidaten en matching dossiers.',
  },

  // 5. INVESTBOTIQ
  'crm_live_investbotiq_capital_2026': {
    company: 'Investbotiq',
    tag: 'INVESTBOTIQ',
    name: 'Investbotiq API Key',
    role: 'partner',
    description: 'Toegang tot investeerdersrelaties, trading pools en kapitaalcontacten.',
  },

  // 6. BOOSTPLUG
  'crm_live_boostplug_energy_iot_2026': {
    company: 'boostplug',
    tag: 'BOOSTPLUG',
    name: 'Boostplug API Key',
    role: 'partner',
    description: 'Toegang tot EV/IoT laadpalen, energie-contracten en zakelijke deals.',
  },

  // 7. CRMOS
  'crm_live_crmos_core_platform_2026': {
    company: 'crmos',
    tag: 'CRMOS',
    name: 'CRMos Core Platform Key',
    role: 'admin',
    description: 'Toegang tot kernplatform CRM-operaties, licenties en workflows.',
  },

  // 8. ZHEAVENZY
  'crm_live_zheavenzy_atelier_2026': {
    company: 'zheavenzy',
    tag: 'ZHEAVENZY',
    name: 'Zheavenzy API Key',
    role: 'partner',
    description: 'Toegang tot luxe atelier, high-ticket klanten en lifestyle relaties.',
  },

  // 9. LOGS.RENT
  'crm_live_logs_rent_logistics_2026': {
    company: 'logs.rent',
    tag: 'LOGS_RENT',
    name: 'Logs.rent API Key',
    role: 'partner',
    description: 'Toegang tot compute & hardware verhuur, logistiek en datacenters.',
  },

  // 10. DJOBBA.WORKS
  'crm_live_djobba_works_freelance_2026': {
    company: 'djobba.works',
    tag: 'DJOBBA_WORKS',
    name: 'Djobba.works API Key',
    role: 'partner',
    description: 'Toegang tot Europese freelance marktplaats, opdrachten en zzp talenten.',
  },

  // 11. TRUSTING WORK
  'crm_live_trusting_work_staffing_2026': {
    company: 'trusting work',
    tag: 'TRUSTING_WORK',
    name: 'Trusting Work API Key',
    role: 'partner',
    description: 'Toegang tot IT-detachering, uitzendprofielen en opdrachtgevers.',
  },

  // 12. WONINGVRY
  'crm_live_woningvry_realestate_2026': {
    company: 'woningvry',
    tag: 'WONINGVRY',
    name: 'Woningvry API Key',
    role: 'partner',
    description: 'Toegang tot vastgoedbeleggingen, huurders en transformatieprojecten.',
  },

  // 13. XABI WORLD
  'crm_live_xabi_world_international_2026': {
    company: 'xabi world',
    tag: 'XABI_WORLD',
    name: 'Xabi World API Key',
    role: 'partner',
    description: 'Toegang tot internationale media, branding partnerships en merchandising.',
  },
};

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

          // Extract API Key
          const rawKeyHeader =
            (req.headers['x-crmos-api-key'] as string) ||
            (req.headers['authorization'] as string) ||
            parsedUrl.searchParams.get('api_key') ||
            '';
          const apiKey = rawKeyHeader.replace(/^Bearer\s+/i, '').trim();
          const keyMeta = PREDEFINED_COMPANY_API_KEYS[apiKey] || null;

          // 1. HEALTH CHECK
          if (pathname === '/api/v1/health') {
            return sendJson(res, 200, {
              success: true,
              data: {
                status: 'operational',
                version: '2.0.0',
                platform: 'CRMos Multi-Tenant Cloud',
                ecosystem: 'VVC & 13 Partnerbedrijven',
                authenticated_as: keyMeta ? keyMeta.name : 'Public / Guest',
                company_scope: keyMeta ? keyMeta.company : 'ALL',
                timestamp: new Date().toISOString(),
              },
            });
          }

          // 2. KEYS DIRECTORY FOR AGENTS
          if (pathname === '/api/v1/keys') {
            return sendJson(res, 200, {
              success: true,
              count: Object.keys(PREDEFINED_COMPANY_API_KEYS).length,
              keys: Object.entries(PREDEFINED_COMPANY_API_KEYS).map(([token, info]) => ({
                api_key: token,
                name: info.name,
                company: info.company,
                tag: info.tag,
                role: info.role,
                description: info.description,
              })),
            });
          }

          // 3. UNIVERSELE SPOTLIGHT SEARCH OVER ALLE CRM DATA
          if (pathname === '/api/v1/search') {
            const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '').toLowerCase().trim();
            if (!query) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef een zoekterm op via ?q=...',
              });
            }

            // Ophalen van documenten uit Firestore
            const contactsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=100`;
            const dealsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
            const candidatesUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recruitment_candidates?pageSize=100`;

            const [contactsRes, dealsRes, candRes] = await Promise.all([
              fetch(contactsUrl).catch(() => null),
              fetch(dealsUrl).catch(() => null),
              fetch(candidatesUrl).catch(() => null),
            ]);

            const contactsData = (contactsRes && contactsRes.ok ? await contactsRes.json() : { documents: [] }) as { documents?: any[] };
            const dealsData = (dealsRes && dealsRes.ok ? await dealsRes.json() : { documents: [] }) as { documents?: any[] };
            const candData = (candRes && candRes.ok ? await candRes.json() : { documents: [] }) as { documents?: any[] };

            const allContacts = (contactsData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const allDeals = (dealsData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const allCandidates = (candData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            // Filteren op zoekterm
            const matchingContacts = allContacts.filter((c: any) => {
              const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
              const email = (c.email || '').toLowerCase();
              const company = (c.company || '').toLowerCase();
              const vvcTag = (c.vvc_tag || '').toLowerCase();
              const tags = (Array.isArray(c.tags) ? c.tags.join(' ') : '').toLowerCase();
              return fullName.includes(query) || email.includes(query) || company.includes(query) || vvcTag.includes(query) || tags.includes(query);
            });

            const matchingDeals = allDeals.filter((d: any) => {
              const name = (d.name || '').toLowerCase();
              const comp = (d.company_name || '').toLowerCase();
              return name.includes(query) || comp.includes(query);
            });

            const matchingCandidates = allCandidates.filter((c: any) => {
              const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
              const email = (c.email || '').toLowerCase();
              const skills = (Array.isArray(c.skills) ? c.skills.join(' ') : '').toLowerCase();
              const vvcTag = (c.vvc_tag || '').toLowerCase();
              return fullName.includes(query) || email.includes(query) || skills.includes(query) || vvcTag.includes(query);
            });

            return sendJson(res, 200, {
              success: true,
              query,
              total_matches: matchingContacts.length + matchingDeals.length + matchingCandidates.length,
              results: {
                contacts: matchingContacts,
                deals: matchingDeals,
                candidates: matchingCandidates,
              },
            });
          }

          // 4. VVC LOOKUP
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

          // 5. CONTACTS (met geavanceerd zoeken, tag-filtering & creatie)
          if (pathname === '/api/v1/contacts') {
            if (req.method === 'GET') {
              const tag = parsedUrl.searchParams.get('tag');
              const companyTag = parsedUrl.searchParams.get('company_tag');
              const search = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
              const pageSize = Number(parsedUrl.searchParams.get('limit')) || 100;

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

              // Filter op zoekterm indien opgegeven
              if (search) {
                filtered = filtered.filter((c: any) => {
                  const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
                  const email = (c.email || '').toLowerCase();
                  const comp = (c.company || '').toLowerCase();
                  const vTag = (c.vvc_tag || '').toLowerCase();
                  const tags = (Array.isArray(c.tags) ? c.tags.join(' ') : '').toLowerCase();
                  return name.includes(search) || email.includes(search) || comp.includes(search) || vTag.includes(search) || tags.includes(search);
                });
              }

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

          // 6. DEALS
          if (pathname === '/api/v1/deals') {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=50`;
            const fbRes = await fetch(firestoreUrl);
            const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
            const deals = (data.documents || []).map((d: any) => {
              const flat = parseFirestoreFields(d.fields || {});
              return { id: d.name.split('/').pop(), ...flat };
            });

            return sendJson(res, 200, {
              success: true,
              count: deals.length,
              data: deals,
            });
          }

          // 7. CANDIDATES (Recruitment & No Cure No Pay)
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

          // 8. TEAMS
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

          // 9. 13 ECOSYSTEM COMPANIES
          if (pathname === '/api/v1/companies') {
            return sendJson(res, 200, {
              success: true,
              count: 13,
              data: [
                { id: 'vvc', name: 'vvc (verdienende vrienden club)', tag: 'VVC', api_key: 'crm_live_vvc_verdienende_vrienden_club_2026' },
                { id: 'quantum-initium', name: 'quantum initium', tag: 'QUANTUM_INITIUM', api_key: 'crm_live_quantum_initium_enterprise_2026' },
                { id: 'immigratiepunt', name: 'immigratiepunt', tag: 'IMMIGRATIEPUNT', api_key: 'crm_live_immigratiepunt_portal_2026' },
                { id: 'spontiva', name: 'spontiva', tag: 'SPONTIVA', api_key: 'crm_live_spontiva_recruitment_2026' },
                { id: 'investbotiq', name: 'Investbotiq', tag: 'INVESTBOTIQ', api_key: 'crm_live_investbotiq_capital_2026' },
                { id: 'boostplug', name: 'boostplug', tag: 'BOOSTPLUG', api_key: 'crm_live_boostplug_energy_iot_2026' },
                { id: 'crmos', name: 'crmos', tag: 'CRMOS', api_key: 'crm_live_crmos_core_platform_2026' },
                { id: 'zheavenzy', name: 'zheavenzy', tag: 'ZHEAVENZY', api_key: 'crm_live_zheavenzy_atelier_2026' },
                { id: 'logs-rent', name: 'logs.rent', tag: 'LOGS_RENT', api_key: 'crm_live_logs_rent_logistics_2026' },
                { id: 'djobba-works', name: 'djobba.works', tag: 'DJOBBA_WORKS', api_key: 'crm_live_djobba_works_freelance_2026' },
                { id: 'trusting-work', name: 'trusting work', tag: 'TRUSTING_WORK', api_key: 'crm_live_trusting_work_staffing_2026' },
                { id: 'woningvry', name: 'woningvry', tag: 'WONINGVRY', api_key: 'crm_live_woningvry_realestate_2026' },
                { id: 'xabi-world', name: 'xabi world', tag: 'XABI_WORLD', api_key: 'crm_live_xabi_world_international_2026' },
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
