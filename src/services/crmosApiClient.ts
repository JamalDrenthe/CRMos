/**
 * CRMos Universal REST API Client & Ecosystem SDK
 *
 * Biedt een universele, type-safe interface voor bi-directionele integraties met CRMos:
 * - VVC (Verdienende Vrienden Club)
 * - Boostplug, Quantum Initium, Spontiva, Investbotiq, Woningvry, etc.
 *
 * Alle calls gaan via de CRMos REST API (`/api/v1/...`). Authenticatie gebeurt met:
 * 1. Een expliciete `apiKey` (X-CRMOS-API-KEY), of
 * 2. Het Firebase ID-token van de ingelogde CRMos gebruiker (Authorization: Bearer).
 *
 * Er bevinden zich bewust GEEN credentials in deze client-bundle.
 */

import { auth } from '@/lib/firebase';
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
  source?: 'api' | 'cache';
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return res.ok && ct.includes('application/json');
}

export class CRMosClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CRMosClientConfig = {}) {
    this.apiKey = config.apiKey || (typeof window !== 'undefined' ? (window as any).__CRMOS_API_KEY__ || '' : '');
    this.baseUrl = config.baseUrl || '';
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-CRMOS-API-KEY'] = this.apiKey;
      return headers;
    }
    // Ingelogde CRMos gebruiker: stuur het Firebase ID-token mee als Bearer
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch {
      // Geen actieve sessie; request zal 401 geven
    }
    return headers;
  }

  private async get(path: string): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, { headers: await this.getHeaders() });
  }

  private async post(path: string, body: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: await this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  /**
   * Health Check
   */
  async getHealth(): Promise<ApiResponse<{ status: string; version: string; platform: string; firebase_connected?: boolean; timestamp: string }>> {
    try {
      const res = await this.get('/api/v1/health');
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'CRMos API onbereikbaar' };
  }

  /**
   * VVC Tag Lookup: haal profiel/aanmelding op via unieke vvc_tag, code of ID
   */
  async lookupVvcTag(tag: string): Promise<ApiResponse<any>> {
    const cleanTag = tag.trim();
    if (!cleanTag) {
      return { success: false, message: 'Geen tag opgegeven' };
    }
    try {
      const res = await this.get(`/api/v1/vvc/lookup?tag=${encodeURIComponent(cleanTag)}`);
      if (isJsonResponse(res)) {
        return { ...(await res.json()), source: 'api' };
      }
    } catch {
      // Offline
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

      const res = await this.get(`/api/v1/contacts?${params.toString()}`);
      if (isJsonResponse(res)) {
        return { ...(await res.json()), source: 'api' };
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Kon contacten niet laden' };
  }

  /**
   * Contact aanmaken
   */
  async createContact(contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await this.post('/api/v1/contacts', contact);
      if (isJsonResponse(res)) {
        return { ...(await res.json()), source: 'api' };
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij aanmaken contact' };
  }

  /**
   * Contact upserten (zoek op email/vvc_tag; update indien gevonden, anders nieuw aanmaken)
   */
  async upsertContact(contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await this.post('/api/v1/contacts/upsert', contact);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij upsert contact' };
  }

  /**
   * Contact bijwerken
   */
  async updateContact(id: string, updates: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const res = await this.post(`/api/v1/contacts/${encodeURIComponent(id)}`, updates, 'PATCH');
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij bijwerken contact' };
  }

  /**
   * Deals ophalen
   */
  async getDeals(company?: string): Promise<ApiResponse<Deal[]>> {
    try {
      const q = company ? `?company=${encodeURIComponent(company)}` : '';
      const res = await this.get(`/api/v1/deals${q}`);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Kon deals niet ophalen' };
  }

  /**
   * Deal aanmaken
   */
  async createDeal(deal: Partial<Deal>): Promise<ApiResponse<Deal>> {
    try {
      const res = await this.post('/api/v1/deals', deal);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij opslaan deal' };
  }

  /**
   * Activiteit / interactielog opslaan (AI agent gespreksnotitie, call log, taken)
   */
  async logActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    try {
      const res = await this.post('/api/v1/activities', activity);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij opslaan activiteit' };
  }

  /**
   * Sollicitatie / No Cure No Pay Kandidaat aanmelden (crm_candidates)
   */
  async submitCandidate(candidate: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    try {
      const res = await this.post('/api/v1/candidates', candidate);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Fout bij opslaan kandidaat' };
  }

  /**
   * Teams ophalen
   */
  async getTeams(): Promise<ApiResponse<CRMTeam[]>> {
    try {
      const res = await this.get('/api/v1/teams');
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Kon teams niet ophalen' };
  }

  /**
   * Universeel Spotlight Zoeken over contacten, deals, kandidaten en bedrijven
   */
  async search(query: string): Promise<ApiResponse<any>> {
    const q = query.trim();
    if (!q) return { success: false, message: 'Geen zoekterm opgegeven' };
    try {
      const res = await this.get(`/api/v1/search?q=${encodeURIComponent(q)}`);
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Zoeken mislukt' };
  }

  /**
   * 13 Ecosysteem Partnerbedrijven ophalen
   */
  async getCompanies(): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get('/api/v1/companies');
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Kon bedrijven niet ophalen' };
  }

  /**
   * Outbound Webhooks ophalen (alleen voor interne gebruikers/admins)
   */
  async getWebhooks(): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get('/api/v1/webhooks');
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return { success: false, message: 'Kon webhooks niet ophalen' };
  }

  /**
   * Outbound Webhook versturen wanneer in CRMos een kandidaat op 'placed'/'hired' wordt gezet
   * of een deal op 'won' wordt gezet (CRMos -> InvestBotIQ & Ecosysteem).
   */
  async dispatchWebhook(
    event: 'candidate.placed' | 'candidate.status_changed' | 'deal.won' | 'deal.stage_changed' | 'contact.upserted',
    data: Record<string, any>,
    company?: string
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.post('/api/v1/webhooks/dispatch', { event, data, company });
      if (isJsonResponse(res)) {
        return await res.json();
      }
    } catch {
      // Offline
    }
    return {
      success: false,
      message: `Webhook event ${event} kon niet verstuurd worden`,
    };
  }
}

// Singleton instantie voor eenvoudige import in CRMos
export const crmosApi = new CRMosClient();
