/**
 * CRMos Universal API Core Engine (v2.2.0)
 *
 * Draait identiek op:
 * 1. Cloudflare Pages Functions (`functions/api/[[catchall]].ts` -> https://crmos.one/api/v1/*)
 * 2. Lokale Vite Dev Server (`src/server/vvcApiPlugin.ts` -> http://localhost:5173/api/v1/*)
 *
 * Volledig voorzien van:
 * - CORS & HTTP OPTIONS Preflight (204 No Content, Access-Control-Max-Age: 86400)
 * - Geauthenticeerde Google Cloud Firestore verbinding (`crmosone-dev`)
 * - Slimme Tag-Merging, LOWER(TRIM(email)) deduplicatie & Timestamped Notitie-Historie bij `/api/v1/contacts/upsert`
 * - Gestandaardiseerde JSON foutafhandeling (`{ success: false, error: "..." }`) & `/api/v1/health` (`status: "online"`)
 * - Outbound Webhooks (`CRMos -> InvestBotIQ` & alle 13 partnerbedrijven) bij `candidate.placed` / `deal.won`
 */

import { PREDEFINED_COMPANY_API_KEYS } from '../data/apiKeysData';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-CRMOS-API-KEY, X-API-Key, x-api-key, X-VVC-Token, X-Webhook-Signature, Accept, Origin',
  'Access-Control-Max-Age': '86400',
};

const DEFAULT_PROJECT_ID = 'crmosone-dev';
const DEFAULT_FIREBASE_WEB_API_KEY = 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo';
const DEFAULT_AGENT_EMAIL = 'api-agent@crmos.one';
const DEFAULT_AGENT_PASSWORD = 'CRMosAgent2026!Secure';

// Standaard geregistreerde Ecosysteem Webhooks (kunnen via POST /api/v1/webhooks worden uitgebreid)
export interface WebhookSubscription {
  id: string;
  company: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  created_at: string;
}

export const DEFAULT_ECOSYSTEM_WEBHOOKS: WebhookSubscription[] = [
  {
    id: 'wh_investbotiq_prod',
    company: 'Investbotiq',
    url: 'https://investbotiq.com/api/webhooks/crmos',
    events: ['candidate.placed', 'candidate.status_changed', 'deal.won', 'deal.stage_changed', 'contact.upserted'],
    secret: 'whsec_investbotiq_crmos_2026',
    active: true,
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'wh_investbotiq_nl',
    company: 'Investbotiq NL',
    url: 'https://investbotiq.nl/api/webhooks/crmos',
    events: ['candidate.placed', 'candidate.status_changed', 'deal.won', 'deal.stage_changed', 'contact.upserted'],
    secret: 'whsec_investbotiq_crmos_2026',
    active: true,
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'wh_vvc_works',
    company: 'vvc (verdienende vrienden club)',
    url: 'https://vvc.works/api/webhooks/crmos',
    events: ['candidate.placed', 'deal.won', 'contact.upserted'],
    secret: 'whsec_vvc_crmos_2026',
    active: true,
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'wh_spontiva',
    company: 'spontiva',
    url: 'https://spontiva.nl/api/webhooks/crmos',
    events: ['candidate.placed', 'deal.won'],
    secret: 'whsec_spontiva_crmos_2026',
    active: true,
    created_at: '2026-01-15T09:00:00.000Z',
  },
];

let cachedIdToken: string | null = null;
let cachedTokenExpiry = 0;

export async function getFirebaseAgentIdToken(
  firebaseWebApiKey = DEFAULT_FIREBASE_WEB_API_KEY,
  agentEmail = DEFAULT_AGENT_EMAIL,
  agentPassword = DEFAULT_AGENT_PASSWORD
): Promise<string | null> {
  if (cachedIdToken && Date.now() < cachedTokenExpiry) {
    return cachedIdToken;
  }
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: agentEmail,
        password: agentPassword,
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
    // Fallback
  }
  return null;
}

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
 * Haalt alle documenten uit een Firestore collectie op (volgt automatisch nextPageToken over pagina's van 300)
 */
async function fetchAllCollectionDocs(
  projectId: string,
  collection: string,
  maxPages = 3
): Promise<any[]> {
  const allDocs: any[] = [];
  let pageToken = '';
  for (let i = 0; i < maxPages; i++) {
    const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=300${tokenParam}`;
    const res = await firestoreFetch(url).catch(() => null);
    if (!res || !res.ok) break;
    const data = (await res.json()) as { documents?: any[]; nextPageToken?: string };
    if (Array.isArray(data.documents)) {
      allDocs.push(...data.documents);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return allDocs;
}

export function parseFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
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

export function toFirestoreFields(data: Record<string, any>): Record<string, any> {
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
            if (typeof v === 'number')
              return Number.isInteger(v) ? { integerValue: v.toString() } : { doubleValue: v };
            if (typeof v === 'boolean') return { booleanValue: v };
            if (typeof v === 'object' && v !== null) return { mapValue: { fields: toFirestoreFields(v) } };
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

export function normalizeContactRecord(id: string, raw: Record<string, any>): Record<string, any> {
  const first_name = raw.first_name || raw.firstName || '';
  const last_name = raw.last_name || raw.lastName || '';
  const email = (raw.email || '').trim().toLowerCase();
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
    email,
    vvc_tag,
    code: vvc_tag,
    company,
    tags,
    company_tags,
  };
}

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

/**
 * Formatteert een timestamp voor de notitie-historie: YYYY-MM-DD HH:mm
 */
function formatNoteTimestamp(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Voegt een nieuwe notitie met timestamp en bron toe aan de bestaande notitie-historie
 * zonder eerdere notities te overschrijven.
 * Voorbeeld: "[2026-11-09 19:10 via InvestBotIQ]: Sollicitatie op Investor Relations Manager..."
 */
function appendTimestampedNote(
  existingNotes: string | undefined,
  incomingNote: string | undefined,
  sourceLabel: string
): string {
  const prev = (existingNotes || '').trim();
  const next = (incomingNote || '').trim();
  if (!next) return prev;

  // Als de incomingNote zelf al een [YYYY-MM-DD ...] prefix heeft, behoud die, anders voeg toe
  const hasTimestampPrefix = /^\[\d{4}-\d{2}-\d{2}/.test(next);
  const formattedEntry = hasTimestampPrefix
    ? next
    : `[${formatNoteTimestamp()} via ${sourceLabel}]: ${next}`;

  if (!prev) return formattedEntry;
  if (prev.includes(next)) return prev;
  return `${prev}\n${formattedEntry}`;
}

/**
 * Haalt alle actieve webhook-registraties op uit Firestore (`organizations/crmos_webhooks_registry`)
 * gecombineerd met de standaard Ecosysteem Webhooks (InvestBotIQ, VVC, Spontiva).
 */
async function getActiveWebhooks(projectId: string): Promise<WebhookSubscription[]> {
  const map = new Map<string, WebhookSubscription>();
  for (const wh of DEFAULT_ECOSYSTEM_WEBHOOKS) {
    map.set(wh.id, wh);
  }
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/organizations/crmos_webhooks_registry`;
    const res = await firestoreFetch(url);
    if (res.ok) {
      const docJson = (await res.json()) as any;
      const flat = parseFirestoreFields(docJson.fields || {});
      if (typeof flat.webhooks_json === 'string') {
        const customList = JSON.parse(flat.webhooks_json) as WebhookSubscription[];
        for (const item of customList) {
          if (item && item.url) {
            map.set(item.id || item.url, item);
          }
        }
      }
    }
  } catch {
    // Gebruik defaults
  }
  return Array.from(map.values()).filter((w) => w.active !== false);
}

/**
 * Verstuurt Outbound Webhooks naar gekoppelde ecosysteem-bedrijven (zoals InvestBotIQ)
 * wanneer bijv. een kandidaat op `placed`/`hired` wordt gezet of een deal op `won`.
 */
export async function dispatchOutboundWebhooks(
  projectId: string,
  event: string,
  payloadData: Record<string, any>,
  targetCompany?: string
): Promise<{
  event: string;
  dispatched_count: number;
  deliveries: Array<{ id: string; company: string; url: string; status: number | string; ok: boolean }>;
}> {
  const webhooks = await getActiveWebhooks(projectId);
  const matching = webhooks.filter((wh) => {
    const eventMatch = wh.events.includes('*') || wh.events.includes(event);
    if (!eventMatch) return false;
    if (targetCompany) {
      const normTarget = targetCompany.toLowerCase();
      const normWh = wh.company.toLowerCase();
      // Stuur altijd naar InvestBotIQ + het specifieke bedrijf
      return normWh.includes(normTarget) || normTarget.includes(normWh) || normWh.includes('investbotiq');
    }
    return true;
  });

  const timestamp = new Date().toISOString();
  const bodyObj = {
    event,
    timestamp,
    source: 'CRMos Universal Cloud API',
    version: '2.2.0',
    action_required:
      event === 'candidate.placed' || event === 'deal.won'
        ? 'upgrade_account_permissions'
        : 'sync_record',
    data: payloadData,
  };
  const bodyStr = JSON.stringify(bodyObj);

  const deliveries = await Promise.all(
    matching.map(async (wh) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CRMOS-Event': event,
            'X-CRMOS-Webhook-Secret': wh.secret || 'whsec_crmos_2026',
            'User-Agent': 'CRMos-Webhook-Dispatcher/2.2',
          },
          body: bodyStr,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return {
          id: wh.id,
          company: wh.company,
          url: wh.url,
          status: res.status,
          ok: res.ok,
        };
      } catch (err: any) {
        return {
          id: wh.id,
          company: wh.company,
          url: wh.url,
          status: err?.name === 'AbortError' ? 'timeout' : 'unreachable',
          ok: false,
        };
      }
    })
  );

  // Log de webhook-dispatch ook in crm_activities voor volledige audit trail
  const logId = `wh_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await saveToFirestoreRest(projectId, 'crm_activities', logId, {
    id: logId,
    type: 'webhook',
    title: `Outbound Webhook: ${event}`,
    description: `Webhook event "${event}" verstuurd naar ${deliveries.map((d) => d.company).join(', ')}`,
    contact_id: payloadData.contact_id || payloadData.id || '',
    deal_id: payloadData.deal_id || '',
    performed_by: 'CRMos Webhook Engine',
    completed: true,
    date: timestamp,
    org_id: 'default_org',
    created_at: timestamp,
  });

  return {
    event,
    dispatched_count: deliveries.length,
    deliveries,
  };
}

export interface ApiCoreRequest {
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  bodyText?: string;
  projectId?: string;
}

export interface ApiCoreResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

function jsonResponse(status: number, payload: Record<string, any>): ApiCoreResponse {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(payload, null, 2),
  };
}

function errorResponse(status: number, errorMessage: string, extra: Record<string, any> = {}): ApiCoreResponse {
  return jsonResponse(status, {
    success: false,
    error: errorMessage,
    message: errorMessage,
    ...extra,
  });
}

function parseJsonBody(rawBody?: string): { ok: true; data: Record<string, any> } | { ok: false; error: string } {
  if (!rawBody || !rawBody.trim()) {
    return { ok: true, data: {} };
  }
  try {
    const parsed = JSON.parse(rawBody);
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'Validatiefout: JSON body moet een geldig object zijn' };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: 'Validatiefout: Ongeldige JSON syntax in request body' };
  }
}

/**
 * Universele Request Handler voor alle `/api/v1/*` en `/api/vvc/*` routes
 */
export async function handleCrmosApiRequest(req: ApiCoreRequest): Promise<ApiCoreResponse> {
  const method = (req.method || 'GET').toUpperCase();

  // 1. CORS Preflight: Direct 204 No Content teruggeven
  if (method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        ...CORS_HEADERS,
      },
      body: '',
    };
  }

  try {
    const parsedUrl = new URL(req.url, 'https://crmos.one');
    const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    const projectId = req.projectId || DEFAULT_PROJECT_ID;

    // Normalize headers lowercase
    const normHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (v !== undefined) normHeaders[k.toLowerCase()] = v;
    }

    const rawKeyHeader =
      normHeaders['x-crmos-api-key'] ||
      normHeaders['x-api-key'] ||
      normHeaders['x-vvc-token'] ||
      normHeaders['authorization'] ||
      parsedUrl.searchParams.get('api_key') ||
      '';
    const apiKey = rawKeyHeader.replace(/^Bearer\s+/i, '').trim();
    const keyMeta = (PREDEFINED_COMPANY_API_KEYS as any)[apiKey] || null;
    const sourceCompanyLabel = keyMeta
      ? keyMeta.company === 'ALL'
        ? 'CRMos Master Agent'
        : keyMeta.company
      : 'Externe Website / Agent';

    // =========================================================================
    // 1. DEDICATED HEALTH ENDPOINT (GET /api/v1/health)
    // Geeft zowel op top-level `"status": "online"` terug (voor IQ Bot) als in `data`
    // =========================================================================
    if (pathname === '/api/v1/health' || pathname === '/api/health') {
      const nowIso = new Date().toISOString();
      const fbToken = await getFirebaseAgentIdToken();
      return jsonResponse(200, {
        status: 'online',
        service: 'crmos-api',
        version: '2.2.0',
        timestamp: nowIso,
        time: nowIso,
        success: true,
        firebase_connected: Boolean(fbToken),
        firebase_project: projectId,
        authenticated_as: keyMeta ? keyMeta.name : 'Public / Ecosystem Guest',
        company_scope: keyMeta ? keyMeta.company : 'ALL',
        capabilities: [
          'read',
          'write',
          'upsert_dedup_merge',
          'timestamped_notes',
          'cors_preflight',
          'outbound_webhooks',
        ],
        data: {
          status: 'online',
          operational: true,
          version: '2.2.0',
          firebase_connected: Boolean(fbToken),
          platform: 'CRMos Multi-Tenant Cloud',
          ecosystem: 'VVC, InvestBotIQ & 13 Partnerbedrijven',
          authenticated_as: keyMeta ? keyMeta.name : 'Public / Ecosystem Guest',
          company_scope: keyMeta ? keyMeta.company : 'ALL',
          timestamp: nowIso,
        },
      });
    }

    // =========================================================================
    // 2. KEYS DIRECTORY (GET /api/v1/keys)
    // =========================================================================
    if (pathname === '/api/v1/keys') {
      return jsonResponse(200, {
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

    // =========================================================================
    // 3. UNIVERSELE SPOTLIGHT SEARCH (GET /api/v1/search?q=...)
    // =========================================================================
    if (pathname === '/api/v1/search') {
      const query = (
        parsedUrl.searchParams.get('q') ||
        parsedUrl.searchParams.get('query') ||
        parsedUrl.searchParams.get('email') ||
        ''
      )
        .toLowerCase()
        .trim();

      if (!query) {
        return errorResponse(400, 'Validatiefout: zoekterm parameter ?q=... is verplicht');
      }

      const dealsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
      const candUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates?pageSize=100`;
      const compUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_companies?pageSize=100`;

      const [rawContactDocs, dealsRes, candRes, compRes] = await Promise.all([
        fetchAllCollectionDocs(projectId, 'crm_contacts', 4),
        firestoreFetch(dealsUrl).catch(() => null),
        firestoreFetch(candUrl).catch(() => null),
        firestoreFetch(compUrl).catch(() => null),
      ]);

      const dealsData = (dealsRes && dealsRes.ok ? await dealsRes.json() : { documents: [] }) as {
        documents?: any[];
      };
      const candData = (candRes && candRes.ok ? await candRes.json() : { documents: [] }) as {
        documents?: any[];
      };
      const compData = (compRes && compRes.ok ? await compRes.json() : { documents: [] }) as {
        documents?: any[];
      };

      const allContacts = rawContactDocs.map((d: any) =>
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
        const companyTags = (Array.isArray(c.company_tags) ? c.company_tags.join(' ') : '').toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          company.includes(query) ||
          vvcTag.includes(query) ||
          teamName.includes(query) ||
          refBy.includes(query) ||
          tags.includes(query) ||
          companyTags.includes(query)
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
        const role = (c.role || c.role_applied || '').toLowerCase();
        const skills = (Array.isArray(c.skills) ? c.skills.join(' ') : '').toLowerCase();
        const vvcTag = (c.vvc_tag || '').toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          role.includes(query) ||
          skills.includes(query) ||
          vvcTag.includes(query)
        );
      });

      const matchingCompanies = allCompanies.filter((co: any) => {
        const name = (co.name || '').toLowerCase();
        const industry = (co.industry || '').toLowerCase();
        return name.includes(query) || industry.includes(query);
      });

      return jsonResponse(200, {
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
        data: matchingContacts,
      });
    }

    // =========================================================================
    // 4. VVC LOOKUP & SYNC (GET /api/v1/vvc/lookup?tag=...)
    // =========================================================================
    if (
      pathname === '/api/v1/vvc/lookup' ||
      pathname === '/api/vvc/lookup' ||
      pathname.startsWith('/api/vvc/')
    ) {
      let tag =
        parsedUrl.searchParams.get('tag') ||
        parsedUrl.searchParams.get('vvc_tag') ||
        parsedUrl.searchParams.get('code') ||
        parsedUrl.searchParams.get('email') ||
        '';

      if (!tag && pathname.startsWith('/api/vvc/')) {
        const seg = pathname.replace('/api/vvc/', '').trim();
        if (seg && seg !== 'lookup') tag = decodeURIComponent(seg);
      }

      if (!tag) {
        return errorResponse(400, 'Validatiefout: geef een geldige VVC tag of e-mail op via ?tag=VVC-XXX');
      }

      const cleanTag = tag.trim();
      const lowerTag = cleanTag.toLowerCase();

      // 1. Directe lookup op document ID
      try {
        const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(cleanTag)}`;
        const directRes = await firestoreFetch(directUrl);
        if (directRes.ok) {
          const docJson = (await directRes.json()) as { fields?: Record<string, any> };
          const flatData = normalizeContactRecord(cleanTag, parseFirestoreFields(docJson.fields || {}));
          return jsonResponse(200, {
            success: true,
            vvc_tag: flatData.vvc_tag || cleanTag,
            collection: 'crm_contacts',
            data: flatData,
          });
        }
      } catch {
        // Fallback naar scan
      }

      // 2. Scan crm_contacts op vvc_tag, code, email of id
      const rawContactDocs = await fetchAllCollectionDocs(projectId, 'crm_contacts', 4);
      if (rawContactDocs.length > 0) {
        const allContacts = rawContactDocs.map((d: any) =>
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
          return jsonResponse(200, {
            success: true,
            vvc_tag: found.vvc_tag || cleanTag,
            collection: 'crm_contacts',
            data: found,
          });
        }
      }

      return errorResponse(404, `Geen contact/aanmelding gevonden in CRMos voor tag "${cleanTag}"`, {
        vvc_tag: cleanTag,
      });
    }

    // =========================================================================
    // 5. SLIMME CONTACTS UPSERT (POST /api/v1/contacts/upsert)
    // - Match op LOWER(TRIM(email)) (en fallback op vvc_tag)
    // - Tags array-union (bestaande tags + nieuwe tags samenvoegen zonder overschrijven!)
    // - Notities met timestamp toevoegen aan notitie-historie:
    //   "[YYYY-MM-DD HH:mm via InvestBotIQ]: ..."
    // =========================================================================
    if (pathname === '/api/v1/contacts/upsert') {
      if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
        return errorResponse(405, 'Validatiefout: gebruik POST voor /api/v1/contacts/upsert');
      }

      const parsedBody = parseJsonBody(req.bodyText);
      if (!parsedBody.ok) {
        return errorResponse(400, parsedBody.error);
      }
      const payload = parsedBody.data;

      // LOWER(TRIM(email))
      const email = String(payload.email || '').trim().toLowerCase();
      const vvcTag = String(payload.vvc_tag || payload.code || '').trim();

      if (!email && !vvcTag) {
        return errorResponse(400, 'Validatiefout: email is verplicht');
      }

      // Haal bestaande contacten op om op LOWER(TRIM(email)) te matchen
      const rawContactDocs = await fetchAllCollectionDocs(projectId, 'crm_contacts', 4);
      const existingDocs: any[] = rawContactDocs.map((d: any) =>
        normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
      );

      const match: any = existingDocs.find((c: any) => {
        const existingEmail = String(c.email || '').trim().toLowerCase();
        const existingTag = String(c.vvc_tag || c.code || '').trim().toLowerCase();
        if (email && existingEmail && existingEmail === email) return true;
        if (!email && vvcTag && existingTag && existingTag === vvcTag.toLowerCase()) return true;
        return false;
      });

      // Bepaal bron-label voor de notitie-historie (bijv. "InvestBotIQ")
      const noteSource =
        payload.source ||
        payload.company ||
        (keyMeta && keyMeta.company !== 'ALL' ? keyMeta.company : 'InvestBotIQ');

      // Bepaal company_tags en tags (ARRAY-UNION zonder oude tags te wissen!)
      const autoCompanyTag =
        keyMeta && keyMeta.tag && keyMeta.tag !== 'ALL'
          ? `#${String(keyMeta.tag).toLowerCase().replace(/^#/, '')}`
          : null;

      const incomingTagsRaw: string[] = Array.isArray(payload.tags)
        ? payload.tags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];
      const incomingCompanyTagsRaw: string[] = Array.isArray(payload.company_tags)
        ? payload.company_tags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];

      // Haal ook #-tags uit payload.tags zodat company_tags altijd compleet is
      const hashTagsFromTags = incomingTagsRaw.filter((t) => t.startsWith('#'));

      const existingCompanyTags: string[] = Array.isArray(match?.company_tags) ? match.company_tags : [];
      const mergedCompanyTags = Array.from(
        new Set([
          ...existingCompanyTags,
          ...incomingCompanyTagsRaw,
          ...hashTagsFromTags,
          ...(autoCompanyTag ? [autoCompanyTag] : []),
        ])
      ).filter(Boolean);

      const existingTags: string[] = Array.isArray(match?.tags) ? match.tags : [];
      const mergedTags = Array.from(
        new Set([
          ...existingTags,
          ...incomingTagsRaw,
          ...mergedCompanyTags,
        ])
      ).filter(Boolean);

      // Notitie-historie opbouwen met timestamp
      const incomingNoteText =
        payload.notes ||
        payload.note ||
        payload.message ||
        (payload.role_applied ? `Sollicitatie op ${payload.role_applied}` : '');

      const mergedNotes = appendTimestampedNote(match?.notes, incomingNoteText, noteSource);

      const existingNotesHistory: string[] = Array.isArray(match?.notes_history)
        ? match.notes_history
        : match?.notes
        ? [String(match.notes)]
        : [];
      const latestFormattedNote = incomingNoteText
        ? `[${formatNoteTimestamp()} via ${noteSource}]: ${incomingNoteText.trim()}`
        : null;
      const mergedNotesHistory = latestFormattedNote
        ? Array.from(new Set([...existingNotesHistory, latestFormattedNote]))
        : existingNotesHistory;

      if (match) {
        // UPDATE BESTAAND CONTACT (behoud bestaande velden indien niet meegegeven, merge tags & notes!)
        const firstName = payload.first_name || payload.firstName || match.first_name || '';
        const lastName = payload.last_name || payload.lastName || match.last_name || '';
        const effectiveTag =
          vvcTag || match.vvc_tag || `VVC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const updatedContact = {
          ...match,
          ...payload,
          id: match.id,
          email: email || match.email,
          first_name: firstName,
          last_name: lastName,
          firstName,
          lastName,
          phone: payload.phone || match.phone || '',
          company: payload.company || match.company || sourceCompanyLabel,
          title: payload.title || payload.role_applied || match.title || 'Contact',
          vvc_tag: effectiveTag,
          code: effectiveTag,
          company_tags: mergedCompanyTags,
          tags: mergedTags,
          notes: mergedNotes,
          notes_history: mergedNotesHistory,
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', match.id, updatedContact);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij bijwerken in Cloud Firestore: ${writeRes.error}`);
        }

        return jsonResponse(200, {
          success: true,
          action: 'updated',
          deduplicated_on: 'email',
          message: `Bestaand contact (${email || match.id}) succesvol samengevoegd (tags & notitie-historie verrijkt)`,
          data: updatedContact,
        });
      } else {
        // CREATE NIEUW CONTACT
        const newId =
          payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const effectiveVvcTag =
          vvcTag || `VVC-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const firstName = payload.first_name || payload.firstName || 'Nieuw';
        const lastName = payload.last_name || payload.lastName || 'Contact';
        const finalTags = Array.from(new Set([...mergedTags, effectiveVvcTag])).filter(Boolean);

        const newContact = {
          id: newId,
          first_name: firstName,
          last_name: lastName,
          firstName,
          lastName,
          email,
          phone: payload.phone || '',
          company:
            payload.company || (keyMeta?.company && keyMeta.company !== 'ALL' ? keyMeta.company : 'Onbekend'),
          title: payload.title || payload.role_applied || 'Contact',
          status: payload.status || 'lead',
          source: payload.source || noteSource,
          vvc_tag: effectiveVvcTag,
          code: effectiveVvcTag,
          team_id: payload.team_id || 'team_passive_network',
          team_name: payload.team_name || 'Passief Referral Netwerk',
          team_status: payload.team_status || 'passive',
          referred_by_name: payload.referred_by_name || noteSource,
          company_tags: mergedCompanyTags,
          tags: finalTags,
          notes: mergedNotes,
          notes_history: mergedNotesHistory,
          org_id: payload.org_id || 'default_org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij aanmaken in Cloud Firestore: ${writeRes.error}`);
        }

        return jsonResponse(201, {
          success: true,
          action: 'created',
          message: `Nieuw contact (${email || newId}) succesvol aangemaakt in CRMos`,
          data: newContact,
        });
      }
    }

    // =========================================================================
    // 6. CONTACTS CRUD (GET / POST / PUT / PATCH /api/v1/contacts)
    // =========================================================================
    if (pathname === '/api/v1/contacts' || pathname.startsWith('/api/v1/contacts/')) {
      const contactIdFromPath = pathname.replace('/api/v1/contacts', '').replace(/^\//, '').trim();

      if (method === 'GET') {
        if (contactIdFromPath) {
          const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(contactIdFromPath)}`;
          const fbRes = await firestoreFetch(singleUrl);
          if (fbRes.ok) {
            const docJson = (await fbRes.json()) as any;
            const flat = normalizeContactRecord(
              contactIdFromPath,
              parseFirestoreFields(docJson.fields || {})
            );
            return jsonResponse(200, { success: true, data: flat });
          }
          return errorResponse(404, `Contact "${contactIdFromPath}" niet gevonden`);
        }

        const tag = parsedUrl.searchParams.get('tag');
        const companyTag = parsedUrl.searchParams.get('company_tag');
        const emailFilter = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();
        const teamId = parsedUrl.searchParams.get('team_id');
        const search = (
          parsedUrl.searchParams.get('q') ||
          parsedUrl.searchParams.get('search') ||
          ''
        )
          .toLowerCase()
          .trim();
        const pageSize = Math.min(Number(parsedUrl.searchParams.get('limit')) || 500, 1000);

        const rawContactDocs = await fetchAllCollectionDocs(projectId, 'crm_contacts', 4);
        const contacts = rawContactDocs.map((d: any) =>
          normalizeContactRecord(d.name.split('/').pop(), parseFirestoreFields(d.fields || {}))
        );

        let filtered = contacts;

        if (emailFilter) {
          filtered = filtered.filter((c: any) => (c.email || '').toLowerCase() === emailFilter);
        }

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
              c.tags?.some((t: string) => t.toLowerCase() === lowerCompTag) ||
              (c.company || '').toLowerCase().includes(lowerCompTag.replace(/^#/, ''))
          );
        }

        if (teamId) {
          filtered = filtered.filter((c: any) => c.team_id === teamId);
        }

        const sliced = filtered.slice(0, pageSize);

        return jsonResponse(200, {
          success: true,
          count: sliced.length,
          total_available: filtered.length,
          data: sliced,
        });
      }

      if (method === 'POST') {
        // Gebruik dezelfde slimme deduplicatie & tag-merging logica wanneer er een email is meegegeven!
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const payload = parsedBody.data;

        if (!payload.email && !payload.first_name && !payload.firstName) {
          return errorResponse(400, 'Validatiefout: email of first_name is verplicht');
        }

        // Als email aanwezig is, routeer via slimme upsert zodat er nooit duplicaten ontstaan
        if (payload.email) {
          return handleCrmosApiRequest({
            ...req,
            url: new URL('/api/v1/contacts/upsert', parsedUrl.origin).toString(),
          });
        }

        const newId =
          payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const effectiveVvcTag =
          payload.vvc_tag ||
          payload.code ||
          `VVC-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const noteSource =
          payload.source || (keyMeta && keyMeta.company !== 'ALL' ? keyMeta.company : 'InvestBotIQ');
        const autoCompanyTag =
          keyMeta && keyMeta.tag && keyMeta.tag !== 'ALL' ? `#${keyMeta.tag.toLowerCase()}` : null;
        const inputCompanyTags = Array.isArray(payload.company_tags) ? payload.company_tags : [];
        const company_tags = Array.from(new Set([...inputCompanyTags, autoCompanyTag])).filter(Boolean);
        const inputTags = Array.isArray(payload.tags) ? payload.tags : [];
        const tags = Array.from(new Set([effectiveVvcTag, ...inputTags, ...company_tags])).filter(Boolean);

        const firstName = payload.first_name || payload.firstName || '';
        const lastName = payload.last_name || payload.lastName || '';
        const formattedNotes = appendTimestampedNote('', payload.notes, noteSource);

        const newContact = {
          id: newId,
          first_name: firstName,
          last_name: lastName,
          firstName,
          lastName,
          email: String(payload.email || '').trim().toLowerCase(),
          phone: payload.phone || '',
          company: payload.company || sourceCompanyLabel,
          title: payload.title || 'Contact',
          status: payload.status || 'lead',
          source: noteSource,
          vvc_tag: effectiveVvcTag,
          code: effectiveVvcTag,
          team_id: payload.team_id || 'team_passive_network',
          team_name: payload.team_name || 'Passief Referral Netwerk',
          team_status: payload.team_status || 'passive',
          referred_by_name: payload.referred_by_name || noteSource,
          company_tags,
          tags,
          notes: formattedNotes,
          org_id: payload.org_id || 'default_org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij opslaan contact: ${writeRes.error}`);
        }

        return jsonResponse(201, {
          success: true,
          action: 'created',
          message: 'Contact succesvol opgeslagen in Cloud Firestore',
          data: newContact,
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const targetId = contactIdFromPath || parsedUrl.searchParams.get('id');
        if (!targetId) {
          return errorResponse(
            400,
            'Validatiefout: geef een contact ID op via /api/v1/contacts/{id} of ?id=...'
          );
        }

        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const updates = parsedBody.data;

        const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(targetId)}`;
        const fbRes = await firestoreFetch(singleUrl);
        const existingData: Record<string, any> = fbRes.ok
          ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
          : {};

        // Merge tags & notities bij PATCH i.p.v. blind overschrijven
        const existingTags = Array.isArray(existingData.tags) ? existingData.tags : [];
        const incomingTags = Array.isArray(updates.tags) ? updates.tags : [];
        const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));

        const existingCompanyTags = Array.isArray(existingData.company_tags) ? existingData.company_tags : [];
        const incomingCompanyTags = Array.isArray(updates.company_tags) ? updates.company_tags : [];
        const mergedCompanyTags = Array.from(new Set([...existingCompanyTags, ...incomingCompanyTags]));

        const noteSource =
          updates.source || (keyMeta && keyMeta.company !== 'ALL' ? keyMeta.company : 'InvestBotIQ');
        const mergedNotes = updates.notes
          ? appendTimestampedNote(existingData.notes, updates.notes, noteSource)
          : existingData.notes || '';

        const merged = normalizeContactRecord(targetId, {
          ...existingData,
          ...updates,
          id: targetId,
          tags: mergedTags,
          company_tags: mergedCompanyTags,
          notes: mergedNotes,
          updated_at: new Date().toISOString(),
        });

        const writeRes = await saveToFirestoreRest(projectId, 'crm_contacts', targetId, merged);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij bijwerken contact: ${writeRes.error}`);
        }

        return jsonResponse(200, {
          success: true,
          action: 'updated',
          message: `Contact ${targetId} succesvol bijgewerkt`,
          data: merged,
        });
      }
    }

    // =========================================================================
    // 7. DEALS CRUD + AUTOMATISCHE WEBHOOK BIJ DEAL WON (/api/v1/deals)
    // =========================================================================
    if (pathname === '/api/v1/deals' || pathname.startsWith('/api/v1/deals/')) {
      const dealIdFromPath = pathname.replace('/api/v1/deals', '').replace(/^\//, '').trim();

      if (method === 'GET') {
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

        return jsonResponse(200, { success: true, count: filtered.length, data: filtered });
      }

      if (method === 'POST') {
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const payload = parsedBody.data;

        if (!payload.name && !payload.title) {
          return errorResponse(400, 'Validatiefout: deal name of title is verplicht');
        }

        const dealId = payload.id || `deal_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const stage = String(payload.stage || 'lead').toLowerCase();

        const newDeal = {
          id: dealId,
          name: payload.name || payload.title,
          title: payload.title || payload.name,
          value: Number(payload.value) || 0,
          stage,
          company_name: payload.company_name || payload.company || sourceCompanyLabel,
          contact_id: payload.contact_id || '',
          contact_email: (payload.contact_email || payload.email || '').trim().toLowerCase(),
          probability: Number(payload.probability) || (stage.includes('won') ? 100 : 25),
          expected_close_date:
            payload.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString(),
          notes: appendTimestampedNote('', payload.notes, sourceCompanyLabel),
          org_id: payload.org_id || 'default_org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_deals', dealId, newDeal);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij aanmaken deal: ${writeRes.error}`);
        }

        // Als de deal direct als 'won' of 'closed-won' binnenkomt, stuur Outbound Webhook!
        let webhookResult = null;
        if (stage === 'won' || stage === 'closed-won' || stage === 'closed_won') {
          webhookResult = await dispatchOutboundWebhooks(
            projectId,
            'deal.won',
            newDeal,
            newDeal.company_name
          );
        }

        return jsonResponse(201, {
          success: true,
          message: 'Deal succesvol aangemaakt in Cloud Firestore',
          data: newDeal,
          webhook_dispatched: webhookResult,
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const targetId = dealIdFromPath || parsedUrl.searchParams.get('id');
        if (!targetId) {
          return errorResponse(400, 'Validatiefout: geef een deal ID op via /api/v1/deals/{id} of ?id=...');
        }

        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const updates = parsedBody.data;

        const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals/${encodeURIComponent(targetId)}`;
        const fbRes = await firestoreFetch(singleUrl);
        const existing: Record<string, any> = fbRes.ok
          ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
          : {};

        const merged: Record<string, any> = {
          ...existing,
          ...updates,
          id: targetId,
          updated_at: new Date().toISOString(),
        };
        const writeRes = await saveToFirestoreRest(projectId, 'crm_deals', targetId, merged);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij bijwerken deal: ${writeRes.error}`);
        }

        // Controleer of de deal van stage is veranderd (bijv. proposal -> won) en stuur Outbound Webhook!
        const newStage = String(merged.stage || '').toLowerCase();
        const isWon = newStage === 'won' || newStage === 'closed-won' || newStage === 'closed_won';
        const webhookEvent = isWon ? 'deal.won' : 'deal.stage_changed';
        const webhookResult = await dispatchOutboundWebhooks(
          projectId,
          webhookEvent,
          merged,
          merged.company_name || merged.company
        );

        return jsonResponse(200, {
          success: true,
          message: `Deal ${targetId} bijgewerkt`,
          data: merged,
          webhook_dispatched: webhookResult,
        });
      }
    }

    // =========================================================================
    // 8. ACTIVITIES / INTERACTION LOGS (/api/v1/activities)
    // =========================================================================
    if (pathname === '/api/v1/activities') {
      if (method === 'GET') {
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

        return jsonResponse(200, { success: true, count: activities.length, data: activities });
      }

      if (method === 'POST') {
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const payload = parsedBody.data;

        const actId = payload.id || `act_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newActivity = {
          id: actId,
          contact_id: payload.contact_id || '',
          deal_id: payload.deal_id || '',
          type: payload.type || 'note',
          title: payload.title || 'AI Agent Notitie',
          description: payload.description || payload.notes || '',
          performed_by: payload.performed_by || sourceCompanyLabel,
          completed: payload.completed ?? true,
          date: payload.date || new Date().toISOString(),
          org_id: payload.org_id || 'default_org',
          created_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_activities', actId, newActivity);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij opslaan activiteit: ${writeRes.error}`);
        }

        return jsonResponse(201, {
          success: true,
          message: 'Activiteit/Gespreksnotitie succesvol gelogd in Cloud Firestore',
          data: newActivity,
        });
      }
    }

    // =========================================================================
    // 9. CANDIDATES + AUTOMATISCHE CONTACT UPSERT & WEBHOOK BIJ HIRED/PLACED
    //    (/api/v1/candidates)
    // =========================================================================
    if (pathname === '/api/v1/candidates' || pathname.startsWith('/api/v1/candidates/')) {
      const candidateIdFromPath = pathname.replace('/api/v1/candidates', '').replace(/^\//, '').trim();

      if (method === 'GET') {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates?pageSize=100`;
        const fbRes = await firestoreFetch(firestoreUrl);
        const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
        const candidates = (data.documents || []).map((d: any) => ({
          id: d.name.split('/').pop(),
          ...parseFirestoreFields(d.fields || {}),
        }));

        return jsonResponse(200, { success: true, count: candidates.length, data: candidates });
      }

      if (method === 'POST') {
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const candidate = parsedBody.data;

        const email = String(candidate.email || '').trim().toLowerCase();
        if (!email) {
          return errorResponse(400, 'Validatiefout: email is verplicht voor kandidaat-registratie');
        }

        const candId = candidate.id || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const effectiveVvcTag =
          candidate.vvc_tag || `VVC-CAND-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const roleApplied =
          candidate.role || candidate.role_applied || candidate.job_title || 'No Cure No Pay Partner';
        const noteSource =
          candidate.source ||
          candidate.company ||
          (keyMeta && keyMeta.company !== 'ALL' ? keyMeta.company : 'InvestBotIQ');

        const formattedNotes = appendTimestampedNote(
          '',
          candidate.notes || `Sollicitatie op ${roleApplied}`,
          noteSource
        );

        const newCand = {
          id: candId,
          first_name: candidate.first_name || candidate.firstName || '',
          last_name: candidate.last_name || candidate.lastName || '',
          email,
          phone: candidate.phone || '',
          status: candidate.status || 'new',
          role: roleApplied,
          role_applied: roleApplied,
          deal_model: candidate.deal_model || 'no_cure_no_pay',
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          experience_years: Number(candidate.experience_years) || 3,
          location: candidate.location || '100% Remote',
          source: noteSource,
          company: candidate.company || sourceCompanyLabel,
          vvc_tag: effectiveVvcTag,
          notes: formattedNotes,
          org_id: candidate.org_id || 'default_org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_candidates', candId, newCand);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij opslaan kandidaat: ${writeRes.error}`);
        }

        // Voer tegelijk een slimme Contact Upsert uit zodat tags (["#careers", "Sollicitant"])
        // en de timestamped notitie ook op het centrale CRM-contact worden samengevoegd!
        const candidateTags = Array.isArray(candidate.tags)
          ? candidate.tags
          : ['#careers', 'Sollicitant', `#${noteSource.toLowerCase().replace(/\s+/g, '_')}`];
        await handleCrmosApiRequest({
          method: 'POST',
          url: 'https://crmos.one/api/v1/contacts/upsert',
          headers: req.headers,
          bodyText: JSON.stringify({
            first_name: newCand.first_name,
            last_name: newCand.last_name,
            email: newCand.email,
            phone: newCand.phone,
            company: newCand.company,
            title: roleApplied,
            vvc_tag: effectiveVvcTag,
            tags: candidateTags,
            notes: candidate.notes || `Sollicitatie op ${roleApplied}`,
            source: noteSource,
          }),
          projectId,
        });

        let webhookResult = null;
        const st = String(newCand.status).toLowerCase();
        if (st === 'placed' || st === 'hired' || st === 'accepted') {
          webhookResult = await dispatchOutboundWebhooks(
            projectId,
            'candidate.placed',
            newCand,
            newCand.company
          );
        }

        return jsonResponse(201, {
          success: true,
          message:
            'Sollicitatie/Kandidaat succesvol geregistreerd in Cloud Firestore & gekoppeld aan CRM-contact',
          data: newCand,
          webhook_dispatched: webhookResult,
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const targetId = candidateIdFromPath || parsedUrl.searchParams.get('id');
        if (!targetId) {
          return errorResponse(
            400,
            'Validatiefout: geef een kandidaat ID op via /api/v1/candidates/{id} of ?id=...'
          );
        }

        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const updates = parsedBody.data;

        const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_candidates/${encodeURIComponent(targetId)}`;
        const fbRes = await firestoreFetch(singleUrl);
        const existing: Record<string, any> = fbRes.ok
          ? parseFirestoreFields(((await fbRes.json()) as any).fields || {})
          : {};

        const noteSource =
          updates.source || (keyMeta && keyMeta.company !== 'ALL' ? keyMeta.company : 'CRMos Teamleider');
        const mergedNotes = updates.notes
          ? appendTimestampedNote(existing.notes, updates.notes, noteSource)
          : existing.notes || '';

        const merged: Record<string, any> = {
          ...existing,
          ...updates,
          id: targetId,
          notes: mergedNotes,
          updated_at: new Date().toISOString(),
        };

        const writeRes = await saveToFirestoreRest(projectId, 'crm_candidates', targetId, merged);
        if (!writeRes.success) {
          return errorResponse(500, `Fout bij bijwerken kandidaat: ${writeRes.error}`);
        }

        // Outbound Webhook versturen zodra kandidaat op placed / hired / accepted wordt gezet!
        const newStatus = String(merged.status || '').toLowerCase();
        const isPlaced = newStatus === 'placed' || newStatus === 'hired' || newStatus === 'accepted';
        const webhookEvent = isPlaced ? 'candidate.placed' : 'candidate.status_changed';
        const webhookResult = await dispatchOutboundWebhooks(
          projectId,
          webhookEvent,
          merged,
          merged.company || merged.source
        );

        return jsonResponse(200, {
          success: true,
          message: `Kandidaat ${targetId} bijgewerkt${isPlaced ? ' & Outbound Webhook naar ecosysteem verstuurd' : ''}`,
          data: merged,
          webhook_dispatched: webhookResult,
        });
      }
    }

    // =========================================================================
    // 10. OUTBOUND WEBHOOKS BEHEER & DISPATCH (/api/v1/webhooks)
    // =========================================================================
    if (pathname === '/api/v1/webhooks' || pathname.startsWith('/api/v1/webhooks/')) {
      const subPath = pathname.replace('/api/v1/webhooks', '').replace(/^\//, '').trim();

      // GET /api/v1/webhooks -> toon alle geregistreerde webhooks (incl. InvestBotIQ)
      if (method === 'GET') {
        const hooks = await getActiveWebhooks(projectId);
        return jsonResponse(200, {
          success: true,
          count: hooks.length,
          supported_events: [
            'candidate.placed',
            'candidate.status_changed',
            'deal.won',
            'deal.stage_changed',
            'contact.upserted',
          ],
          data: hooks,
        });
      }

      // POST /api/v1/webhooks/dispatch of /api/v1/webhooks/test -> Trigger direct een Outbound Webhook!
      if (method === 'POST' && (subPath === 'dispatch' || subPath === 'test')) {
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const body = parsedBody.data;

        const event = body.event || 'candidate.placed';
        const payloadData = body.data || {
          id: 'cand_demo_investbotiq_01',
          first_name: 'Alex',
          last_name: 'van Dijk',
          email: 'alex.vandijk@investbotiq.com',
          role_applied: 'Investor Relations Manager',
          status: 'placed',
          company: 'Investbotiq',
          upgrade_portal_access: true,
        };

        const dispatchRes = await dispatchOutboundWebhooks(
          projectId,
          event,
          payloadData,
          body.company
        );

        return jsonResponse(200, {
          success: true,
          message: `Outbound webhook "${event}" succesvol uitgevoerd naar ${dispatchRes.dispatched_count} endpoint(s)`,
          ...dispatchRes,
        });
      }

      // POST /api/v1/webhooks -> Registreer een nieuwe webhook URL (bijv. vanuit InvestBotIQ)
      if (method === 'POST') {
        const parsedBody = parseJsonBody(req.bodyText);
        if (!parsedBody.ok) return errorResponse(400, parsedBody.error);
        const body = parsedBody.data;

        if (!body.url || !String(body.url).startsWith('http')) {
          return errorResponse(
            400,
            'Validatiefout: geef een geldige webhook URL op (bijv. https://investbotiq.com/api/webhooks/crmos)'
          );
        }

        const currentHooks = await getActiveWebhooks(projectId);
        const newHook: WebhookSubscription = {
          id: body.id || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          company: body.company || sourceCompanyLabel,
          url: String(body.url).trim(),
          events: Array.isArray(body.events) && body.events.length > 0
            ? body.events
            : ['candidate.placed', 'deal.won', 'contact.upserted'],
          secret: body.secret || 'whsec_crmos_2026',
          active: true,
          created_at: new Date().toISOString(),
        };

        const updatedHooks = [
          ...currentHooks.filter((h) => h.url !== newHook.url),
          newHook,
        ];

        await saveToFirestoreRest(projectId, 'organizations', 'crmos_webhooks_registry', {
          id: 'crmos_webhooks_registry',
          name: 'CRMos Outbound Webhooks Registry',
          webhooks_json: JSON.stringify(updatedHooks),
          updated_at: new Date().toISOString(),
        });

        return jsonResponse(201, {
          success: true,
          message: `Webhook endpoint ${newHook.url} succesvol geregistreerd voor events: ${newHook.events.join(', ')}`,
          data: newHook,
        });
      }
    }

    // =========================================================================
    // 11. TEAMS (GET /api/v1/teams)
    // =========================================================================
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

      return jsonResponse(200, { success: true, count: teams.length, data: teams });
    }

    // =========================================================================
    // 12. 13 ECOSYSTEM COMPANIES (GET /api/v1/companies)
    // =========================================================================
    if (pathname === '/api/v1/companies') {
      const compUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_companies?pageSize=100`;
      const fbRes = await firestoreFetch(compUrl);
      const firestoreCompanies = fbRes.ok
        ? (((await fbRes.json()) as any).documents || []).map((d: any) => ({
            id: d.name.split('/').pop(),
            ...parseFirestoreFields(d.fields || {}),
          }))
        : [];

      return jsonResponse(200, {
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

    return errorResponse(404, `Endpoint ${pathname} niet gevonden in CRMos API v1`);
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Interne Server API Fout';
    return errorResponse(500, msg);
  }
}
