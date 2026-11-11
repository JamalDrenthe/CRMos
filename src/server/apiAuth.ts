/**
 * CRMos API Authenticatie & Tenant-Scoping
 *
 * Server-only module (wordt nooit in de client bundle meegenomen).
 * API keys worden uitsluitend als SHA-256 hashes opgehaald uit:
 * 1. De Cloudflare/Node secret `CRMOS_API_KEYS_JSON` (JSON array van key records)
 * 2. De Firestore collectie `crm_api_keys` (veld `token_hash`, `key_hash` of legacy `full_token`)
 *
 * Ingelogde CRMos app-gebruikers kunnen ook met hun Firebase ID-token
 * (`Authorization: Bearer <idToken>`) de API bereiken; dat token wordt
 * geverifieerd via de Firebase Auth REST API (`accounts:lookup`).
 */

export interface ApiKeyMeta {
  id: string;
  name: string;
  company: string;
  tag: string; // 'ALL' = geen tenant-beperking
  role: 'super_admin' | 'admin' | 'partner' | 'user';
  via: 'api_key' | 'firebase_auth';
}

/** SHA-256 hex digest; werkt op Cloudflare Workers én Node 18+. */
export async function sha256Hex(input: string): Promise<string> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(input).digest('hex');
}

const KEYS_CACHE_TTL_MS = 60_000;
let keysCache: { loadedAt: number; records: any[] } = { loadedAt: 0, records: [] };

function normalizeKeyRecord(raw: any): ApiKeyMeta | null {
  if (!raw) return null;
  const tag = String(raw.tag || raw.company_tag || '').replace(/^#/, '') || 'ALL';
  return {
    id: raw.id || raw.name || 'api_key',
    name: raw.name || 'API Key',
    company: raw.company || raw.company_name || '',
    tag,
    role:
      raw.role === 'super_admin' || raw.role === 'admin'
        ? raw.role
        : tag === 'ALL'
          ? 'admin'
          : 'partner',
    via: 'api_key',
  };
}

function parseEnvKeys(env: Record<string, string | undefined>): any[] {
  const raw = env.CRMOS_API_KEYS_JSON || env.CRMOS_API_KEYS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadFirestoreKeyRecords(
  projectId: string,
  firestoreFetch: (url: string, init?: RequestInit) => Promise<Response>,
  parseFirestoreFields: (fields: Record<string, any>) => Record<string, any>
): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_api_keys?pageSize=300`;
  const res = await firestoreFetch(url).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json()) as { documents?: any[] };
  return (data.documents || []).map((d: any) => ({
    id: d.name.split('/').pop(),
    ...parseFirestoreFields(d.fields || {}),
  }));
}

/**
 * Contant-time string vergelijking via SHA-256 hashing van beide kanten.
 */
async function hashesEqual(a: string, b: string): Promise<boolean> {
  return (await sha256Hex(a)) === (await sha256Hex(b));
}

/**
 * Lost de gepresenteerde API key op naar metadata.
 * Vergelijkt op SHA-256 hash én (legacy) plaintext uit Firestore/env records.
 */
export async function resolveApiKeyMeta(
  apiKey: string,
  projectId: string,
  env: Record<string, string | undefined>,
  firestoreFetch: (url: string, init?: RequestInit) => Promise<Response>,
  parseFirestoreFields: (fields: Record<string, any>) => Record<string, any>
): Promise<ApiKeyMeta | null> {
  const presented = (apiKey || '').trim();
  if (!presented) return null;
  const presentedHash = await sha256Hex(presented);

  // 1. Env-secret sleutels (Cloudflare Pages secret CRMOS_API_KEYS_JSON)
  for (const rec of parseEnvKeys(env)) {
    if (rec.status && rec.status !== 'active') continue;
    const meta = normalizeKeyRecord(rec);
    if (!meta) continue;
    if (rec.key_hash && (await hashesEqual(rec.key_hash, presentedHash))) return meta;
    if (rec.token_hash && (await hashesEqual(rec.token_hash, presentedHash))) return meta;
    if (rec.key && (await hashesEqual(rec.key, presented))) return meta;
  }

  // 2. Firestore `crm_api_keys` (met korte cache)
  if (Date.now() - keysCache.loadedAt > KEYS_CACHE_TTL_MS) {
    keysCache = {
      loadedAt: Date.now(),
      records: await loadFirestoreKeyRecords(projectId, firestoreFetch, parseFirestoreFields),
    };
  }
  for (const rec of keysCache.records) {
    if (rec.status && rec.status !== 'active') continue;
    const meta = normalizeKeyRecord(rec);
    if (!meta) continue;
    if (rec.key_hash && (await hashesEqual(rec.key_hash, presentedHash))) return meta;
    if (rec.token_hash && (await hashesEqual(rec.token_hash, presentedHash))) return meta;
    if (rec.full_token && (await hashesEqual(rec.full_token, presented))) return meta;
  }

  return null;
}

/**
 * Verifieert een Firebase ID-token via de Identity Toolkit REST API.
 * Geeft een 'user'-meta terug (tag ALL: de CRMos app is intern).
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  env: Record<string, string | undefined>
): Promise<ApiKeyMeta | null> {
  const webApiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_WEB_API_KEY;
  if (!idToken || !webApiKey) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${webApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{ localId?: string; email?: string }> };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    return {
      id: `user_${user.localId}`,
      name: user.email || 'CRMos App User',
      company: 'CRMos App',
      tag: 'ALL',
      role: 'user',
      via: 'firebase_auth',
    };
  } catch {
    return null;
  }
}

/** True wanneer de key/app-user geen tenant-beperking heeft. */
export function hasFullScope(meta: ApiKeyMeta | null): boolean {
  if (!meta) return false;
  return (
    meta.tag === 'ALL' ||
    meta.role === 'super_admin' ||
    meta.role === 'admin' ||
    meta.via === 'firebase_auth'
  );
}

/**
 * Behoort een CRM-record tot de tenant-scope van deze API key?
 * Match op company_tags (#tag) of op company/company_name.
 */
export function recordInKeyScope(record: Record<string, any>, meta: ApiKeyMeta): boolean {
  if (hasFullScope(meta)) return true;
  const scopeTag = meta.tag.toLowerCase();
  const scopeCompany = (meta.company || '').toLowerCase();

  const companyTags: string[] = Array.isArray(record.company_tags) ? record.company_tags : [];
  if (companyTags.some((t) => String(t).toLowerCase().replace(/^#/, '') === scopeTag)) return true;
  const tags: string[] = Array.isArray(record.tags) ? record.tags : [];
  if (tags.some((t) => String(t).toLowerCase().replace(/^#/, '') === scopeTag)) return true;

  const recCompany = String(record.company || record.company_name || '').toLowerCase();
  if (scopeCompany && recCompany && (recCompany === scopeCompany || recCompany.includes(scopeCompany)))
    return true;

  return false;
}
