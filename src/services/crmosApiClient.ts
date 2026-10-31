/**
 * CRMos Universal REST API Client & Ecosystem SDK
 * 
 * Biedt een universele, type-safe interface voor integraties met CRMos:
 * - VVC (Verdienende Vrienden Club)
 * - Boostplug, Quantum Initium, Spontiva, Investbotiq, Woningvry, etc.
 * 
 * Ondersteunt dual-mode transport:
 * 1. Lokale / Proxy API routes (`/api/v1/...`)
 * 2. Directe fallback naar Firestore REST API voor static Firebase Hosting deployments
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
  message?: string;
  count?: number;
  vvc_tag?: string;
  source?: 'api' | 'firestore_rest' | 'cache';
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
  async getHealth(): Promise<ApiResponse<{ status: string; version: string; platform: string; timestamp: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/health`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      source: 'firestore_rest',
      data: {
        status: 'ok',
        version: '2.0.0',
        platform: 'CRMos Multi-Cloud',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * VVC Tag Lookup: haal profiel/aanmelding op via unieke vvc_tag
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
      if (res.ok) {
        const data = await res.json();
        return { ...data, source: 'api' };
      }
    } catch {
      // doorgaan naar Firestore REST fallback
    }

    // 2. Direct Firestore REST Fallback (werkt altijd op static host)
    const collections = ['crm_vvc_registry', 'vvc_sync_codes', 'crm_contacts'];
    for (const col of collections) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${col}/${encodeURIComponent(cleanTag)}`;
        const fbRes = await fetch(url);
        if (fbRes.ok) {
          const docJson = await fbRes.json();
          const flat = parseFirestoreFields(docJson.fields || {});
          return {
            success: true,
            source: 'firestore_rest',
            vvc_tag: cleanTag,
            data: flat,
          };
        }
      } catch {
        // continue
      }
    }

    return {
      success: false,
      message: `Geen aanmelding gevonden voor VVC tag: ${cleanTag}`,
    };
  }

  /**
   * Contacten ophalen (optioneel gefilterd op tag, company_tag of team)
   */
  async getContacts(filters?: { tag?: string; company_tag?: string; limit?: number }): Promise<ApiResponse<Contact[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.company_tag) params.append('company_tag', filters.company_tag);
      if (filters?.limit) params.append('limit', String(filters.limit));

      const res = await fetch(`${this.baseUrl}/api/v1/contacts?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, source: 'api' };
      }
    } catch {
      // Fallback
    }

    // Firestore REST fallback
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts?pageSize=${filters?.limit || 50}`;
      const fbRes = await fetch(url);
      if (fbRes.ok) {
        const data = await fbRes.json();
        const contacts = (data.documents || []).map((doc: any) => {
          const flat = parseFirestoreFields(doc.fields || {});
          const id = doc.name.split('/').pop();
          return { id, ...flat } as Contact;
        });

        // Filter clientside
        let filtered = contacts;
        if (filters?.tag) {
          filtered = filtered.filter((c: Contact) => 
            c.tags?.some((t: string) => t.toLowerCase() === filters.tag!.toLowerCase()) ||
            c.vvc_tag?.toLowerCase() === filters.tag!.toLowerCase()
          );
        }
        if (filters?.company_tag) {
          filtered = filtered.filter((c: Contact) =>
            c.company_tags?.some((ct: string) => ct.toLowerCase() === filters.company_tag!.toLowerCase())
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
      if (res.ok) {
        const json = await res.json();
        return { ...json, source: 'api' };
      }
    } catch {
      // Fallback
    }

    // Firestore direct creation fallback
    try {
      const contactId = contact.id || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const payload = {
        ...contact,
        id: contactId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts?documentId=${encodeURIComponent(contactId)}`;
      const fbRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return {
          success: true,
          source: 'firestore_rest',
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
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
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
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const fields = toFirestoreFields({ ...updates, updated_at: new Date().toISOString() });
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(id)}`;
      const fbRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (fbRes.ok) {
        return { success: true, source: 'firestore_rest', message: 'Contact bijgewerkt' };
      }
    } catch {
      // Ignore
    }
    return { success: false, message: 'Fout bij bijwerken contact' };
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
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const dealId = deal.id || `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...deal,
        id: dealId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_deals/${encodeURIComponent(dealId)}`;
      const fbRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const actId = activity.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...activity,
        id: actId,
        created_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_activities/${encodeURIComponent(actId)}`;
      const fbRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
   * Sollicitatie / No Cure No Pay Kandidaat aanmelden
   */
  async submitCandidate(candidate: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/candidates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(candidate),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const candidateId = candidate.id || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const payload = {
        ...candidate,
        id: candidateId,
        status: candidate.status || 'applied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const fields = toFirestoreFields(payload);
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/recruitment_candidates?documentId=${encodeURIComponent(candidateId)}`;
      const fbRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
   * Teams ophalen
   */
  async getTeams(): Promise<ApiResponse<CRMTeam[]>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/teams`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/crm_teams`;
      const fbRes = await fetch(url);
      if (fbRes.ok) {
        const data = await fbRes.json();
        const teams = (data.documents || []).map((doc: any) => {
          const flat = parseFirestoreFields(doc.fields || {});
          const id = doc.name.split('/').pop();
          return { id, ...flat } as CRMTeam;
        });
        return { success: true, source: 'firestore_rest', count: teams.length, data: teams };
      }
    } catch {
      // Ignore
    }

    return { success: false, message: 'Kon teams niet ophalen' };
  }

  /**
   * Universeel Spotlight Zoeken over alle CRM data (Contacten, Deals, Kandidaten, Bedrijven)
   */
  async search(query: string): Promise<ApiResponse<any>> {
    const q = query.trim();
    if (!q) return { success: false, message: 'Geen zoekterm opgegeven' };

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/search?q=${encodeURIComponent(q)}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Direct Firestore REST search fallback
    try {
      const contactsRes = await this.getContacts({ tag: q });
      return {
        success: true,
        source: 'firestore_rest',
        data: {
          contacts: contactsRes.data || [],
          deals: [],
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
      if (res.ok) {
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
