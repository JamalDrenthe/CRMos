import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { PREDEFINED_COMPANY_API_KEYS } from '../data/apiKeysData';

export { PREDEFINED_COMPANY_API_KEYS };

const FIREBASE_WEB_API_KEY =
  process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo';
const AGENT_EMAIL = process.env.CRMOS_FIREBASE_AGENT_EMAIL || 'api-agent@crmos.one';
const AGENT_PASSWORD = process.env.CRMOS_FIREBASE_AGENT_PASSWORD || 'CRMosAgent2026!Secure';

let cachedIdToken: string | null = null;
let cachedTokenExpiry = 0;

/**
 * Haalt automatisch een geldig Firebase Auth Bearer idToken op voor de CRMos API Service Agent
 * zodat alle Cloud Firestore REST calls geautoriseerd zijn (200 OK).
 */
async function getFirebaseAgentIdToken(): Promise<string | null> {
  if (cachedIdToken && Date.now() < cachedTokenExpiry) {
    return cachedIdToken;
  }
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: AGENT_EMAIL,
        password: AGENT_PASSWORD,
        returnSecureToken: true,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { idToken?: string; expiresIn?: string };
      if (data.idToken) {
        cachedIdToken = data.idToken;
        const expiresInSec = Number(data.expiresIn) || 3600;
        cachedTokenExpiry = Date.now() + (expiresInSec - 300) * 1000;
        return cachedIdToken;
      }
    }
  } catch {
    // Fallback indien offline
  }
  return null;
}

/**
 * Voert een geauthenticeerde fetch uit naar Cloud Firestore REST API
 */
async function firestoreFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const idToken = await getFirebaseAgentIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  return fetch(url, {
    ...init,
    headers,
  });
}

/**
 * Helper om Firestore REST API document fields om te zetten naar platte JSON
 */
function parseFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
  const result: Record<string, any> = {};
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
 * Normaliseert contactvelden (ondersteunt zowel snake_case als camelCase uit Firestore)
 */
function normalizeContactRecord(id: string, raw: Record<string, any>): Record<string, any> {
  const first_name = raw.first_name || raw.firstName || '';
  const last_name = raw.last_name || raw.lastName || '';
  const vvc_tag = raw.vvc_tag || raw.code || '';
  const company = raw.company || raw.company_name || raw.companyName || '';
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const company_tags = Array.isArray(raw.company_tags) ? raw.company_tags : [];

  return {
    ...raw,
    id,
    first_name,
    last_name,
    firstName: first_name,
    lastName: last_name,
    vvc_tag,
    code: vvc_tag,
    company,
    tags,
    company_tags,
  };
}

/**
 * Helper om platte JSON om te zetten naar Firestore REST fields structuur
 */
function toFirestoreFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: v.toString() } : { doubleValue: v };
            if (typeof v === 'boolean') return { booleanValue: v };
            return { stringValue: String(v) };
          }),
        },
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * Schrijf direct een document naar Cloud Firestore REST API (geauthenticeerd)
 */
async function saveToFirestoreRest(
  projectId: string,
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const fields = toFirestoreFields(data);
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(
      docId
    )}`;
    const res = await firestoreFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });

    if (res.ok) {
      return { success: true, data };
    }
    const errText = await res.text();
    return { success: false, error: errText };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Firestore REST write failed' };
  }
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CRMOS-API-KEY, X-VVC-Token',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * CRMos Universal REST API Engine — Bi-directioneel (Lezen & Schrijven op Live Firebase Cloud Firestore)
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
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CRMOS-API-KEY, X-VVC-Token',
          });
          res.end();
          return;
        }

        try {
          const parsedUrl = new URL(urlStr, 'http://localhost');
          const pathname = parsedUrl.pathname;
          const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';

          // Authenticatie controleren
          const rawKeyHeader =
            (req.headers['x-crmos-api-key'] as string) ||
            (req.headers['authorization'] as string) ||
            parsedUrl.searchParams.get('api_key') ||
            '';
          const apiKey = rawKeyHeader.replace(/^Bearer\s+/i, '').trim();
          const keyMeta = (PREDEFINED_COMPANY_API_KEYS as any)[apiKey] || null;

          // 1. HEALTH CHECK
          if (pathname === '/api/v1/health') {
            const fbToken = await getFirebaseAgentIdToken();
            return sendJson(res, 200, {
              success: true,
              data: {
                status: 'operational',
                version: '2.1.0',
                firebase_connected: Boolean(fbToken),
                firebase_project: projectId,
                capabilities: ['read', 'write', 'update', 'upsert', 'search'],
                platform: 'CRMos Multi-Tenant Cloud',
                ecosystem: 'VVC & 13 Partnerbedrijven',
                authenticated_as: keyMeta ? keyMeta.name : 'Public / Guest',
                company_scope: keyMeta ? keyMeta.company : 'ALL',
                timestamp: new Date().toISOString(),
              },
            });
          }

          // 2. KEYS DIRECTORY
          if (pathname === '/api/v1/keys') {
            return sendJson(res, 200, {
              success: true,
              count: Object.keys(PREDEFINED_COMPANY_API_KEYS).length,
              keys: Object.entries(PREDEFINED_COMPANY_API_KEYS).map(([token, info]: any) => ({
                api_key: token,
                name: info.name,
                company: info.company,
                tag: info.tag,
                role: info.role,
                description: info.description,
              })),
            });
          }

          // 3. UNIVERSELE SPOTLIGHT SEARCH OVER ALLE LIVE FIREBASE CRM DATA
          if (pathname === '/api/v1/search') {
            const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '').toLowerCase().trim();
            if (!query) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef een zoekterm op via ?q=...',
              });
            }

            const contactsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=300`;
            const dealsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
            const candUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates?pageSize=100`;
            const compUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_companies?pageSize=100`;

            const [contactsRes, dealsRes, candRes, compRes] = await Promise.all([
              firestoreFetch(contactsUrl).catch(() => null),
              firestoreFetch(dealsUrl).catch(() => null),
              firestoreFetch(candUrl).catch(() => null),
              firestoreFetch(compUrl).catch(() => null),
            ]);

            const contactsData = (contactsRes && contactsRes.ok ? await contactsRes.json() : { documents: [] }) as { documents?: any[] };
            const dealsData = (dealsRes && dealsRes.ok ? await dealsRes.json() : { documents: [] }) as { documents?: any[] };
            const candData = (candRes && candRes.ok ? await candRes.json() : { documents: [] }) as { documents?: any[] };
            const compData = (compRes && compRes.ok ? await compRes.json() : { documents: [] }) as { documents?: any[] };

            const allContacts = (contactsData.documents || []).map((d: any) =>
              normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
            );

            const allDeals = (dealsData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const allCandidates = (candData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const allCompanies = (compData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const matchingContacts = allContacts.filter((c: any) => {
              const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
              const email = (c.email || '').toLowerCase();
              const phone = (c.phone || '').toLowerCase();
              const company = (c.company || '').toLowerCase();
              const vvcTag = (c.vvc_tag || '').toLowerCase();
              const teamName = (c.team_name || '').toLowerCase();
              const refBy = (c.referred_by_name || '').toLowerCase();
              const tags = (Array.isArray(c.tags) ? c.tags.join(' ') : '').toLowerCase();
              return (
                fullName.includes(query) ||
                email.includes(query) ||
                phone.includes(query) ||
                company.includes(query) ||
                vvcTag.includes(query) ||
                teamName.includes(query) ||
                refBy.includes(query) ||
                tags.includes(query)
              );
            });

            const matchingDeals = allDeals.filter((d: any) => {
              const name = (d.name || d.title || '').toLowerCase();
              const comp = (d.company_name || d.company || '').toLowerCase();
              return name.includes(query) || comp.includes(query);
            });

            const matchingCandidates = allCandidates.filter((c: any) => {
              const fullName = `${c.first_name || c.firstName || ''} ${c.last_name || c.lastName || ''}`.toLowerCase();
              const email = (c.email || '').toLowerCase();
              const skills = (Array.isArray(c.skills) ? c.skills.join(' ') : '').toLowerCase();
              const vvcTag = (c.vvc_tag || '').toLowerCase();
              return fullName.includes(query) || email.includes(query) || skills.includes(query) || vvcTag.includes(query);
            });

            const matchingCompanies = allCompanies.filter((co: any) => {
              const name = (co.name || '').toLowerCase();
              const industry = (co.industry || '').toLowerCase();
              return name.includes(query) || industry.includes(query);
            });

            return sendJson(res, 200, {
              success: true,
              query,
              total_matches:
                matchingContacts.length +
                matchingDeals.length +
                matchingCandidates.length +
                matchingCompanies.length,
              results: {
                contacts: matchingContacts,
                deals: matchingDeals,
                candidates: matchingCandidates,
                companies: matchingCompanies,
              },
            });
          }

          // 4. VVC LOOKUP & SYNC (Zoekt op ID, vvc_tag, code of email in crm_contacts)
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
                message: 'Geef een geldige unieke VVC tag op via ?tag=VVC-XXX',
              });
            }

            const cleanTag = tag.trim();
            const lowerTag = cleanTag.toLowerCase();

            // 1. Directe lookup op document ID in crm_contacts
            try {
              const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(cleanTag)}`;
              const directRes = await firestoreFetch(directUrl);
              if (directRes.ok) {
                const docJson = (await directRes.json()) as { fields?: Record<string, any> };
                const flatData = normalizeContactRecord(cleanTag, parseFirestoreFields(docJson.fields || {}));
                return sendJson(res, 200, {
                  success: true,
                  vvc_tag: flatData.vvc_tag || cleanTag,
                  collection: 'crm_contacts',
                  data: flatData,
                });
              }
            } catch {
              // Ga door naar volledige scan
            }

            // 2. Zoek in crm_contacts op vvc_tag, code, email of naam
            const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=300`;
            const listRes = await firestoreFetch(listUrl);
            if (listRes.ok) {
              const listData = (await listRes.json()) as { documents?: any[] };
              const allContacts = (listData.documents || []).map((d: any) =>
                normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
              );
              const found = allContacts.find(
                (c: any) =>
                  (c.vvc_tag || '').toLowerCase() === lowerTag ||
                  (c.code || '').toLowerCase() === lowerTag ||
                  (c.id || '').toLowerCase() === lowerTag ||
                  (c.email || '').toLowerCase() === lowerTag ||
                  (Array.isArray(c.tags) && c.tags.some((t: string) => t.toLowerCase() === lowerTag))
              );
              if (found) {
                return sendJson(res, 200, {
                  success: true,
                  vvc_tag: found.vvc_tag || cleanTag,
                  collection: 'crm_contacts',
                  data: found,
                });
              }
            }

            return sendJson(res, 404, {
              success: false,
              vvc_tag: cleanTag,
              message: `Geen contact/aanmelding gevonden in CRMos voor tag "${cleanTag}"`,
            });
          }

          // 5. CONTACTS UPSERT (POST /api/v1/contacts/upsert)
          if (pathname === '/api/v1/contacts/upsert' && req.method === 'POST') {
            const rawBody = await readBody(req);
            const payload = JSON.parse(rawBody || '{}');
            const email = (payload.email || '').trim().toLowerCase();
            const vvcTag = (payload.vvc_tag || payload.code || '').trim();

            if (!email && !vvcTag) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef minimaal een email of vvc_tag mee voor upsert.',
              });
            }

            // Zoeken naar bestaand contact in live Firestore
            const contactsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=300`;
            const fbRes = await firestoreFetch(contactsUrl);
            const contactsData = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
            const existingDocs: any[] = (contactsData.documents || []).map((d: any) =>
              normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
            );

            const match: any = existingDocs.find(
              (c: any) =>
                (email && (c.email || '').toLowerCase() === email) ||
                (vvcTag && (c.vvc_tag || '').toLowerCase() === vvcTag.toLowerCase())
            );

            const autoCompanyTag = keyMeta && keyMeta.tag !== 'ALL' ? `#${keyMeta.tag.toLowerCase()}` : null;
            const existingCompanyTags = Array.isArray(match?.company_tags) ? match.company_tags : [];
            const newCompanyTags = Array.isArray(payload.company_tags) ? payload.company_tags : [];
            const mergedCompanyTags = Array.from(
              new Set([...existingCompanyTags, ...newCompanyTags, autoCompanyTag])
            ).filter(Boolean);

            const existingTags = Array.isArray(match?.tags) ? match.tags : [];
            const newTags = Array.isArray(payload.tags) ? payload.tags : [];
            const mergedTags = Array.from(
              new Set([...existingTags, ...newTags, ...mergedCompanyTags])
            ).filter(Boolean);

            if (match) {
              const firstName = payload.first_name || payload.firstName || match.first_name || '';
              const lastName = payload.last_name || payload.lastName || match.last_name || '';
              const effectiveTag = vvcTag || match.vvc_tag || `VVC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

              const updatedContact = {
                ...match,
                ...payload,
                id: match.id,
                first_name: firstName,
                last_name: lastName,
                firstName,
                lastName,
                vvc_tag: effectiveTag,
                code: effectiveTag,
                company_tags: mergedCompanyTags,
                tags: mergedTags,
                updated_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', match.id, updatedContact);

              return sendJson(res, writeRes.success ? 200 : 500, {
                success: writeRes.success,
                action: 'updated',
                message: writeRes.success
                  ? `Bestaand contact ${match.id} succesvol bijgewerkt in Firebase Cloud Firestore`
                  : `Fout bij bijwerken: ${writeRes.error}`,
                data: updatedContact,
              });
            } else {
              const newId = payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const effectiveVvcTag =
                vvcTag || `VVC-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const firstName = payload.first_name || payload.firstName || 'Nieuw';
              const lastName = payload.last_name || payload.lastName || 'Contact';

              const newContact = {
                id: newId,
                first_name: firstName,
                last_name: lastName,
                firstName,
                lastName,
                email: email || '',
                phone: payload.phone || '',
                company: payload.company || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'Onbekend'),
                title: payload.title || 'Contact',
                status: payload.status || 'lead',
                source: payload.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent API'),
                vvc_tag: effectiveVvcTag,
                code: effectiveVvcTag,
                team_id: payload.team_id || 'team_passive_network',
                team_name: payload.team_name || 'Passief Referral Netwerk',
                team_status: payload.team_status || 'passive',
                referred_by_name: payload.referred_by_name || (keyMeta ? keyMeta.name : 'AI Agent'),
                company_tags: mergedCompanyTags,
                tags: Array.from(new Set([effectiveVvcTag, ...mergedTags])),
                notes: payload.notes || '',
                org_id: payload.org_id || 'default_org',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);

              return sendJson(res, writeRes.success ? 201 : 500, {
                success: writeRes.success,
                action: 'created',
                message: writeRes.success
                  ? `Nieuw contact ${newId} succesvol aangemaakt in Firebase Cloud Firestore`
                  : `Fout bij aanmaken: ${writeRes.error}`,
                data: newContact,
              });
            }
          }

          // 6. CONTACTS: GET (lezen/zoeken), POST (aanmaken), PUT/PATCH (bijwerken)
          if (pathname === '/api/v1/contacts' || pathname.startsWith('/api/v1/contacts/')) {
            const contactIdFromPath = pathname.replace('/api/v1/contacts', '').replace(/^\//, '').trim();

            // GET CONTACTS
            if (req.method === 'GET') {
              if (contactIdFromPath) {
                const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(contactIdFromPath)}`;
                const fbRes = await firestoreFetch(singleUrl);
                if (fbRes.ok) {
                  const docJson = (await fbRes.json()) as any;
                  const flat = normalizeContactRecord(
                    contactIdFromPath,
                    parseFirestoreFields(docJson.fields || {})
                  );
                  return sendJson(res, 200, { success: true, data: flat });
                }
                return sendJson(res, 404, { success: false, message: `Contact ${contactIdFromPath} niet gevonden` });
              }

              const tag = parsedUrl.searchParams.get('tag');
              const companyTag = parsedUrl.searchParams.get('company_tag');
              const teamId = parsedUrl.searchParams.get('team_id');
              const search = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
              const pageSize = Number(parsedUrl.searchParams.get('limit')) || 300;

              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=${pageSize}`;
              const fbRes = await firestoreFetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const contacts = (data.documents || []).map((d: any) =>
                normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
              );

              let filtered = contacts;

              if (search) {
                filtered = filtered.filter((c: any) => {
                  const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
                  const email = (c.email || '').toLowerCase();
                  const comp = (c.company || '').toLowerCase();
                  const vTag = (c.vvc_tag || '').toLowerCase();
                  const team = (c.team_name || '').toLowerCase();
                  const tags = (Array.isArray(c.tags) ? c.tags.join(' ') : '').toLowerCase();
                  return (
                    name.includes(search) ||
                    email.includes(search) ||
                    comp.includes(search) ||
                    vTag.includes(search) ||
                    team.includes(search) ||
                    tags.includes(search)
                  );
                });
              }

              if (tag) {
                const lowerTag = tag.toLowerCase();
                filtered = filtered.filter(
                  (c: any) =>
                    (c.vvc_tag || '').toLowerCase() === lowerTag ||
                    (c.code || '').toLowerCase() === lowerTag ||
                    c.tags?.some((t: string) => t.toLowerCase() === lowerTag)
                );
              }
              if (companyTag) {
                const lowerCompTag = companyTag.toLowerCase();
                filtered = filtered.filter(
                  (c: any) =>
                    c.company_tags?.some((ct: string) => ct.toLowerCase() === lowerCompTag) ||
                    (c.company || '').toLowerCase().includes(lowerCompTag.replace(/^#/, ''))
                );
              }
              if (teamId) {
                filtered = filtered.filter((c: any) => c.team_id === teamId);
              }

              return sendJson(res, 200, {
                success: true,
                count: filtered.length,
                data: filtered,
              });
            }

            // POST: CONTACT AANMAKEN
            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              const newId = payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const effectiveVvcTag =
                payload.vvc_tag || payload.code || `VVC-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

              const autoCompanyTag = keyMeta && keyMeta.tag !== 'ALL' ? `#${keyMeta.tag.toLowerCase()}` : null;
              const inputCompanyTags = Array.isArray(payload.company_tags) ? payload.company_tags : [];
              const company_tags = Array.from(new Set([...inputCompanyTags, autoCompanyTag])).filter(Boolean);

              const inputTags = Array.isArray(payload.tags) ? payload.tags : [];
              const tags = Array.from(new Set([effectiveVvcTag, ...inputTags, ...company_tags])).filter(Boolean);

              const firstName = payload.first_name || payload.firstName || '';
              const lastName = payload.last_name || payload.lastName || '';

              const newContact = {
                id: newId,
                first_name: firstName,
                last_name: lastName,
                firstName,
                lastName,
                email: payload.email || '',
                phone: payload.phone || '',
                company: payload.company || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'Onbekend'),
                title: payload.title || 'Contact',
                status: payload.status || 'lead',
                source: payload.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent API'),
                vvc_tag: effectiveVvcTag,
                code: effectiveVvcTag,
                team_id: payload.team_id || 'team_passive_network',
                team_name: payload.team_name || 'Passief Referral Netwerk',
                team_status: payload.team_status || 'passive',
                referred_by_name: payload.referred_by_name || '',
                company_tags,
                tags,
                notes: payload.notes || '',
                org_id: payload.org_id || 'default_org',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);

              return sendJson(res, writeRes.success ? 201 : 500, {
                success: writeRes.success,
                message: writeRes.success
                  ? 'Contact succesvol opgeslagen in Cloud Firestore'
                  : `Fout bij opslaan: ${writeRes.error}`,
                data: newContact,
              });
            }

            // PUT / PATCH: CONTACT BIJWERKEN
            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = contactIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) {
                return sendJson(res, 400, {
                  success: false,
                  message: 'Geef een contact ID op via het pad (/api/v1/contacts/:id) of ?id=...',
                });
              }

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(targetId)}`;
              const fbRes = await firestoreFetch(singleUrl);
              const existingData = fbRes.ok
                ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
                : {};

              const merged = normalizeContactRecord(targetId, {
                ...existingData,
                ...updates,
                id: targetId,
                updated_at: new Date().toISOString(),
              });

              const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', targetId, merged);

              return sendJson(res, writeRes.success ? 200 : 500, {
                success: writeRes.success,
                message: writeRes.success
                  ? `Contact ${targetId} succesvol bijgewerkt in Cloud Firestore`
                  : `Fout bij bijwerken: ${writeRes.error}`,
                data: merged,
              });
            }
          }

          // 7. DEALS: GET, POST (aanmaken), PUT/PATCH (bijwerken)
          if (pathname === '/api/v1/deals' || pathname.startsWith('/api/v1/deals/')) {
            const dealIdFromPath = pathname.replace('/api/v1/deals', '').replace(/^\//, '').trim();

            if (req.method === 'GET') {
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
              const fbRes = await firestoreFetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const deals = (data.documents || []).map((d: any) => ({
                id: d.name.split('/').pop(),
                ...parseFirestoreFields(d.fields || {}),
              }));

              const compFilter = parsedUrl.searchParams.get('company');
              const filtered = compFilter
                ? deals.filter((d: any) =>
                    (d.company_name || d.company || '').toLowerCase().includes(compFilter.toLowerCase())
                  )
                : deals;

              return sendJson(res, 200, { success: true, count: filtered.length, data: filtered });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              const dealId = payload.id || `deal_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

              const newDeal = {
                id: dealId,
                name: payload.name || payload.title || 'Nieuwe Deal',
                title: payload.title || payload.name || 'Nieuwe Deal',
                value: Number(payload.value) || 0,
                stage: payload.stage || 'lead',
                company_name: payload.company_name || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'CRMos'),
                contact_id: payload.contact_id || '',
                probability: payload.probability || 20,
                expected_close_date:
                  payload.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString(),
                org_id: payload.org_id || 'default_org',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_deals', dealId, newDeal);

              return sendJson(res, writeRes.success ? 201 : 500, {
                success: writeRes.success,
                message: writeRes.success
                  ? 'Deal succesvol aangemaakt in Cloud Firestore'
                  : `Fout bij aanmaken deal: ${writeRes.error}`,
                data: newDeal,
              });
            }

            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = dealIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) return sendJson(res, 400, { success: false, message: 'Geen deal ID opgegeven' });

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals/${encodeURIComponent(targetId)}`;
              const fbRes = await firestoreFetch(singleUrl);
              const existing = fbRes.ok
                ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
                : {};

              const merged = { ...existing, ...updates, id: targetId, updated_at: new Date().toISOString() };
              const writeRes = await saveToFirestoreRest(projectId, 'crm_deals', targetId, merged);

              return sendJson(res, writeRes.success ? 200 : 500, {
                success: writeRes.success,
                message: writeRes.success ? `Deal ${targetId} bijgewerkt` : writeRes.error,
                data: merged,
              });
            }
          }

          // 8. ACTIVITIES / INTERACTION LOGS (Gespreksnotities, meetings, taken van AI agent)
          if (pathname === '/api/v1/activities') {
            if (req.method === 'GET') {
              const contactId = parsedUrl.searchParams.get('contact_id');
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_activities?pageSize=100`;
              const fbRes = await firestoreFetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              let activities = (data.documents || []).map((d: any) => ({
                id: d.name.split('/').pop(),
                ...parseFirestoreFields(d.fields || {}),
              }));

              if (contactId) {
                activities = activities.filter((a: any) => a.contact_id === contactId);
              }

              return sendJson(res, 200, { success: true, count: activities.length, data: activities });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              const actId = payload.id || `act_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

              const newActivity = {
                id: actId,
                contact_id: payload.contact_id || '',
                deal_id: payload.deal_id || '',
                type: payload.type || 'note',
                title: payload.title || 'AI Agent Notitie',
                description: payload.description || '',
                performed_by: payload.performed_by || (keyMeta ? keyMeta.name : 'AI Agent'),
                completed: payload.completed ?? true,
                date: payload.date || new Date().toISOString(),
                org_id: payload.org_id || 'default_org',
                created_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_activities', actId, newActivity);

              return sendJson(res, writeRes.success ? 201 : 500, {
                success: writeRes.success,
                message: writeRes.success
                  ? 'Activiteit/Gespreksnotitie succesvol gelogd in Cloud Firestore'
                  : `Fout bij opslaan activiteit: ${writeRes.error}`,
                data: newActivity,
              });
            }
          }

          // 9. CANDIDATES (Recruitment & No Cure No Pay -> crm_candidates in live Firestore)
          if (pathname === '/api/v1/candidates' || pathname.startsWith('/api/v1/candidates/')) {
            const candidateIdFromPath = pathname.replace('/api/v1/candidates', '').replace(/^\//, '').trim();

            if (req.method === 'GET') {
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates?pageSize=100`;
              const fbRes = await firestoreFetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const candidates = (data.documents || []).map((d: any) => ({
                id: d.name.split('/').pop(),
                ...parseFirestoreFields(d.fields || {}),
              }));

              return sendJson(res, 200, { success: true, count: candidates.length, data: candidates });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const candidate = JSON.parse(rawBody || '{}');
              const candId = candidate.id || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const effectiveVvcTag =
                candidate.vvc_tag || `VVC-CAND-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

              const newCand = {
                id: candId,
                first_name: candidate.first_name || candidate.firstName || '',
                last_name: candidate.last_name || candidate.lastName || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                status: candidate.status || 'new',
                role: candidate.role || candidate.job_title || 'No Cure No Pay Partner',
                skills: Array.isArray(candidate.skills) ? candidate.skills : [],
                experience_years: Number(candidate.experience_years) || 3,
                location: candidate.location || '100% Remote',
                source: candidate.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent Funnel'),
                vvc_tag: effectiveVvcTag,
                notes: candidate.notes || '',
                org_id: candidate.org_id || 'default_org',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const writeRes = await saveToFirestoreRest(projectId, 'crm_candidates', candId, newCand);

              return sendJson(res, writeRes.success ? 201 : 500, {
                success: writeRes.success,
                message: writeRes.success
                  ? 'Sollicitatie/Kandidaat succesvol geregistreerd in Cloud Firestore (crm_candidates)'
                  : `Fout bij opslaan kandidaat: ${writeRes.error}`,
                data: newCand,
              });
            }

            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = candidateIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) return sendJson(res, 400, { success: false, message: 'Geen kandidaat ID opgegeven' });

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates/${encodeURIComponent(targetId)}`;
              const fbRes = await firestoreFetch(singleUrl);
              const existing = fbRes.ok
                ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
                : {};

              const merged = { ...existing, ...updates, id: targetId, updated_at: new Date().toISOString() };
              const writeRes = await saveToFirestoreRest(projectId, 'crm_candidates', targetId, merged);

              return sendJson(res, writeRes.success ? 200 : 500, {
                success: writeRes.success,
                message: writeRes.success ? `Kandidaat ${targetId} bijgewerkt` : writeRes.error,
                data: merged,
              });
            }
          }

          // 10. TEAMS (Referral Netwerk & 7 Kernleiders uit Live Firestore)
          if (pathname === '/api/v1/teams') {
            const regUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/organizations/crmos_ecosystem_registry`;
            const fbRes = await firestoreFetch(regUrl);
            let teams: any[] = [];
            if (fbRes.ok) {
              const docJson = (await fbRes.json()) as any;
              const flat = parseFirestoreFields(docJson.fields || {});
              if (typeof flat.teams_json === 'string') {
                try {
                  teams = JSON.parse(flat.teams_json);
                } catch {
                  teams = [];
                }
              }
            }

            return sendJson(res, 200, { success: true, count: teams.length, data: teams });
          }

          // 11. 13 ECOSYSTEM COMPANIES (Live uit Firestore crm_companies + API keys)
          if (pathname === '/api/v1/companies') {
            const compUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_companies?pageSize=100`;
            const fbRes = await firestoreFetch(compUrl);
            const firestoreCompanies = fbRes.ok
              ? (((await fbRes.json()) as any).documents || []).map((d: any) => ({
                  id: d.name.split('/').pop(),
                  ...parseFirestoreFields(d.fields || {}),
                }))
              : [];

            return sendJson(res, 200, {
              success: true,
              count: 13,
              firestore_companies_count: firestoreCompanies.length,
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
              firestore_companies: firestoreCompanies,
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
