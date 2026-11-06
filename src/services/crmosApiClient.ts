/**
 * CRMos Universal REST API Client & Ecosystem SDK
 *
 * Biedt een universele, type-safe interface voor bi-directionele integraties met CRMos:
 * - VVC (Verdienende Vrienden Club)
 * - Boostplug, Quantum Initium, Spontiva, Investbotiq, Woningvry, etc.
 *
 * Ondersteunt dual-mode transport:
 * 1. Lokale / Server API routes (`/api/v1/...`)
 * 2. Directe geauthenticeerde verbinding met Live Firebase Cloud Firestore (`crmosone-dev`)
 *    zodat lezen & schrijven ook op static Firebase Hosting en vanuit externe AI agents altijd 200 OK geeft.
 */

import type { Contact, Candidate, CRMTeam, Deal, Activity } from '@/types';

export interface CRMosClientConfig {
  apiKey?: string;
  baseUrl?: string;
  projectId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  results?: any;
  action?: 'created' | 'updated';
  message?: string;
  count?: number;
  total_matches?: number;
  vvc_tag?: string;
  source?: 'api' | 'firestore_rest' | 'cache';
}

const FIREBASE_WEB_API_KEY =
  (import.meta as any)?.env?.VITE_FIREBASE_API_KEY || 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo';
const AGENT_EMAIL = 'api-agent@crmos.one';
const AGENT_PASSWORD = 'CRMosAgent2026!Secure';

let cachedIdToken: string | null = null;
let cachedTokenExpiry = 0;

/**
 * Haalt automatisch een geldig Firebase Auth Bearer idToken op voor de CRMos API Service Agent
 * zodat directe Cloud Firestore REST calls altijd geautoriseerd zijn (200 OK).
 */
export async function getFirebaseAgentIdToken(): Promise<string | null> {
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
    // Offline fallback
  }
  return null;
}

async function firestoreRestFetch(url: string, init: RequestInit = {}): Promise<Response> {
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

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return res.ok && ct.includes('application/json');
}

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

function normalizeContactRecord(id: string, raw: Record<string, any>): Contact {
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
    vvc_tag,
    company,
    tags,
    company_tags,
  } as Contact;
}

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

export class CRMosClient {
  private apiKey: string;
  private baseUrl: string;
  private projectId: string;

  constructor(config: CRMosClientConfig = {}) {
    this.apiKey = config.apiKey || (typeof window !== 'undefined' ? (window as any).__CRMOS_API_KEY__ || '' : '');
    this.baseUrl = config.baseUrl || '';
    this.projectId = config.projectId || (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-CRMOS-API-KEY'] = this.apiKey;
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Health Check
   */
  async getHealth(): Promise<ApiResponse<{ status: string; version: string; platform: string; firebase_connected?: boolean; timestamp: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/health`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback naar directe Firebase Auth verificatie
    }
    const token = await getFirebaseAgentIdToken();
    return {
      success: true,
      source: 'firestore_rest',
      data: {
        status: 'operational',
        version: '2.1.0',
        firebase_connected: Boolean(token),
        platform: 'CRMos Multi-Cloud (Direct Firebase Firestore)',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * VVC Tag Lookup: haal profiel/aanmelding op via unieke vvc_tag, code of ID
   */
  async lookupVvcTag(tag: string): Promise<ApiResponse<any>> {
    const cleanTag = tag.trim();
    if (!cleanTag) {
      return { success: false, message: 'Geen tag opgegeven' };
    }

    // 1. Probeer eerst /api/v1/vvc/lookup
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/vvc/lookup?tag=${encodeURIComponent(cleanTag)}`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        const data = await res.json();
        return { ...data, source: 'api' };
      }
    } catch {
      // doorgaan naar Firestore REST fallback
    }

    // 2. Directe geauthenticeerde Firestore REST Fallback (crm_contacts)
    try {
      const directUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(cleanTag)}`;
      const directRes = await firestoreRestFetch(directUrl);
      if (directRes.ok) {
        const docJson = await directRes.json();
        const flat = normalizeContactRecord(cleanTag, parseFirestoreFields(docJson.fields || {}));
        return {
          success: true,
          source: 'firestore_rest',
          vvc_tag: flat.vvc_tag || cleanTag,
          data: flat,
        };
      }

      // Scan op vvc_tag / code / email
      const listUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts?pageSize=300`;
      const listRes = await firestoreRestFetch(listUrl);
      if (listRes.ok) {
        const listData = await listRes.json();
        const lower = cleanTag.toLowerCase();
        const contacts = (listData.documents || []).map((doc: any) =>
          normalizeContactRecord(doc.name.split('/').pop(), parseFirestoreFields(doc.fields || {}))
        );
        const match = contacts.find(
          (c: any) =>
            (c.vvc_tag || '').toLowerCase() === lower ||
            (c.code || '').toLowerCase() === lower ||
            (c.email || '').toLowerCase() === lower ||
            (c.id || '').toLowerCase() === lower
        );
        if (match) {
          return {
            success: true,
            source: 'firestore_rest',
            vvc_tag: match.vvc_tag || cleanTag,
            data: match,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      message: `Geen aanmelding gevonden voor VVC tag: ${cleanTag}`,
    };
  }

  /**
   * Contacten ophalen (optioneel gefilterd op tag, company_tag, q of limit)
   */
  async getContacts(filters?: { tag?: string; company_tag?: string; q?: string; limit?: number }): Promise<ApiResponse<Contact[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.company_tag) params.append('company_tag', filters.company_tag);
      if (filters?.q) params.append('q', filters.q);
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await fetch(`${this.baseUrl}/api/v1/contacts?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        const data = await res.json();
        return { ...data, source: 'api' };
      }
    } catch {
      // Fallback
    }

    // Geauthenticeerde Firestore REST fallback
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts?pageSize=${filters?.limit || 300}`;
      const fbRes = await firestoreRestFetch(url);
      if (fbRes.ok) {
        const data = await fbRes.json();
        const contacts: Contact[] = (data.documents || []).map((doc: any) =>
          normalizeContactRecord(doc.name.split('/').pop(), parseFirestoreFields(doc.fields || {}))
        );

        let filtered = contacts;
        if (filters?.q) {
          const q = filters.q.toLowerCase();
          filtered = filtered.filter((c: Contact) => {
            const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
            return (
              fullName.includes(q) ||
              (c.email || '').toLowerCase().includes(q) ||
              (c.company || '').toLowerCase().includes(q) ||
              (c.vvc_tag || '').toLowerCase().includes(q) ||
              (c.team_name || '').toLowerCase().includes(q)
            );
          });
        }
        if (filters?.tag) {
          const tLower = filters.tag.toLowerCase();
          filtered = filtered.filter(
            (c: Contact) =>
              c.tags?.some((t: string) => t.toLowerCase() === tLower) ||
              c.vvc_tag?.toLowerCase() === tLower
          );
        }
        if (filters?.company_tag) {
          const ctLower = filters.company_tag.toLowerCase();
          filtered = filtered.filter((c: Contact) =>
            c.company_tags?.some((ct: string) => ct.toLowerCase() === ctLower)
          );
        }

        return {
          success: true,
          source: 'firestore_rest',
          count: filtered.length,
          data: filtered,
        };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Fout bij ophalen contacten' };
    }

    return { success: false, message: 'Kon contacten niet laden' };
  }

  /**
   * Contact aanmaken
   */
  async createContact(contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/contacts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(contact),
      });
      if (isJsonResponse(res)) {
        const json = await res.json();
        return { ...json, source: 'api' };
      }
    } catch {
      // Fallback
    }

    // Geauthenticeerde Firestore direct creation fallback
    try {
      const contactId = contact.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const vvcTag = contact.vvc_tag || `VVC-AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const payload = {
        ...contact,
        id: contactId,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        vvc_tag: vvcTag,
        code: vvcTag,
        org_id: contact.org_id || 'default_org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(contactId)}`;
      const fbRes = await firestoreRestFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return {
          success: true,
          source: 'firestore_rest',
          action: 'created',
          data: payload as Contact,
        };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Direct Firestore create failed' };
    }

    return { success: false, message: 'Fout bij aanmaken contact' };
  }

  /**
   * Contact upserten (zoek op email/vvc_tag; update indien gevonden, anders nieuw aanmaken)
   */
  async upsertContact(contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/contacts/upsert`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(contact),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback naar directe Firestore upsert
    }

    const email = (contact.email || '').trim().toLowerCase();
    const vvcTag = (contact.vvc_tag || '').trim().toLowerCase();
    const existingList = await this.getContacts({ limit: 300 });
    const match = (existingList.data || []).find(
      (c: Contact) =>
        (email && (c.email || '').toLowerCase() === email) ||
        (vvcTag && (c.vvc_tag || '').toLowerCase() === vvcTag)
    );

    if (match) {
      const updated = await this.updateContact(match.id, contact);
      return {
        ...updated,
        action: 'updated',
        data: { ...match, ...contact } as Contact,
      };
    }

    return this.createContact(contact);
  }

  /**
   * Contact bijwerken
   */
  async updateContact(id: string, updates: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/contacts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const singleUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(id)}`;
      const getRes = await firestoreRestFetch(singleUrl);
      const existing = getRes.ok ? parseFirestoreFields(((await getRes.json()) as any).fields || {}) : {};
      const merged = {
        ...existing,
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(merged);
      const fbRes = await firestoreRestFetch(singleUrl, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return {
          success: true,
          source: 'firestore_rest',
          message: `Contact ${id} bijgewerkt in Cloud Firestore`,
          data: normalizeContactRecord(id, merged),
        };
      }
    } catch {
      // Ignore
    }
    return { success: false, message: 'Fout bij bijwerken contact' };
  }

  /**
   * Deals ophalen
   */
  async getDeals(company?: string): Promise<ApiResponse<Deal[]>> {
    try {
      const q = company ? `?company=${encodeURIComponent(company)}` : '';
      const res = await fetch(`${this.baseUrl}/api/v1/deals${q}`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
      const fbRes = await firestoreRestFetch(url);
      if (fbRes.ok) {
        const data = await fbRes.json();
        const deals = (data.documents || []).map((doc: any) => ({
          id: doc.name.split('/').pop(),
          ...parseFirestoreFields(doc.fields || {}),
        })) as Deal[];
        return { success: true, source: 'firestore_rest', count: deals.length, data: deals };
      }
    } catch {
      // Ignore
    }
    return { success: false, message: 'Kon deals niet ophalen' };
  }

  /**
   * Deal aanmaken
   */
  async createDeal(deal: Partial<Deal>): Promise<ApiResponse<Deal>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(deal),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const dealId = deal.id || `deal_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...deal,
        id: dealId,
        org_id: deal.org_id || 'default_org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_deals/${encodeURIComponent(dealId)}`;
      const fbRes = await firestoreRestFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return { success: true, source: 'firestore_rest', data: payload as Deal };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Deal opslaan mislukt' };
    }
    return { success: false, message: 'Fout bij opslaan deal' };
  }

  /**
   * Activiteit / interactielog opslaan (AI agent gespreksnotitie, call log, taken)
   */
  async logActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/activities`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(activity),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const actId = activity.id || `act_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...activity,
        id: actId,
        org_id: activity.org_id || 'default_org',
        created_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_activities/${encodeURIComponent(actId)}`;
      const fbRes = await firestoreRestFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return { success: true, source: 'firestore_rest', data: payload as Activity };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Activiteit loggen mislukt' };
    }
    return { success: false, message: 'Fout bij opslaan activiteit' };
  }

  /**
   * Sollicitatie / No Cure No Pay Kandidaat aanmelden (crm_candidates in live Firestore)
   */
  async submitCandidate(candidate: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/candidates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(candidate),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const candidateId = candidate.id || `cand_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...candidate,
        id: candidateId,
        status: candidate.status || 'new',
        org_id: candidate.org_id || 'default_org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_candidates/${encodeURIComponent(candidateId)}`;
      const fbRes = await firestoreRestFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return {
          success: true,
          source: 'firestore_rest',
          data: payload as Candidate,
        };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Direct candidate create failed' };
    }

    return { success: false, message: 'Fout bij opslaan kandidaat' };
  }

  /**
   * Teams ophalen (uit organizations/crmos_ecosystem_registry in Live Firestore)
   */
  async getTeams(): Promise<ApiResponse<CRMTeam[]>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/teams`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/organizations/crmos_ecosystem_registry`;
      const fbRes = await firestoreRestFetch(url);
      if (fbRes.ok) {
        const docJson = await fbRes.json();
        const flat = parseFirestoreFields(docJson.fields || {});
        const teams: CRMTeam[] = typeof flat.teams_json === 'string' ? JSON.parse(flat.teams_json) : [];
        return { success: true, source: 'firestore_rest', count: teams.length, data: teams };
      }
    } catch {
      // Ignore
    }

    return { success: false, message: 'Kon teams niet ophalen' };
  }

  /**
   * Universeel Spotlight Zoeken over alle Live Firebase CRM data (Contacten, Deals, Kandidaten)
   */
  async search(query: string): Promise<ApiResponse<any>> {
    const q = query.trim();
    if (!q) return { success: false, message: 'Geen zoekterm opgegeven' };

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/search?q=${encodeURIComponent(q)}`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Directe geauthenticeerde Firestore REST search fallback
    try {
      const contactsRes = await this.getContacts({ q });
      const dealsRes = await this.getDeals(q);
      const contacts = contactsRes.data || [];
      const deals = (dealsRes.data || []).filter(
        (d: any) =>
          (d.name || d.title || '').toLowerCase().includes(q.toLowerCase()) ||
          (d.company_name || '').toLowerCase().includes(q.toLowerCase())
      );
      return {
        success: true,
        source: 'firestore_rest',
        total_matches: contacts.length + deals.length,
        results: {
          contacts,
          deals,
          candidates: [],
        },
        data: {
          contacts,
          deals,
          candidates: [],
        },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Zoeken mislukt' };
    }
  }

  /**
   * 13 Ecosysteem Partnerbedrijven ophalen
   */
  async getCompanies(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/companies`, {
        headers: this.getHeaders(),
      });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      source: 'cache',
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
    };
  }
}

// Singleton instantie voor eenvoudige import in CRMos
export const crmosApi = new CRMosClient();
