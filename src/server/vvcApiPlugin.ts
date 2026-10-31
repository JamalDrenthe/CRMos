import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { PREDEFINED_COMPANY_API_KEYS } from '../data/apiKeysData';

export { PREDEFINED_COMPANY_API_KEYS };

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
 * Schrijf direct een document naar Cloud Firestore REST API
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
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
 * CRMos Universal REST API Engine — Bi-directioneel (Lezen & Schrijven)
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
            return sendJson(res, 200, {
              success: true,
              data: {
                status: 'operational',
                version: '2.0.0',
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

          // 3. UNIVERSELE SPOTLIGHT SEARCH OVER ALLE CRM DATA
          if (pathname === '/api/v1/search') {
            const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '').toLowerCase().trim();
            if (!query) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef een zoekterm op via ?q=...',
              });
            }

            const contactsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=100`;
            const dealsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
            const candUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recruitment_candidates?pageSize=100`;

            const [contactsRes, dealsRes, candRes] = await Promise.all([
              fetch(contactsUrl).catch(() => null),
              fetch(dealsUrl).catch(() => null),
              fetch(candUrl).catch(() => null),
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

          // 4. VVC LOOKUP & SYNC
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
                // Next
              }
            }

            return sendJson(res, 404, {
              success: false,
              vvc_tag: tag.trim(),
              message: `Geen aanmelding gevonden in CRMos voor tag "${tag.trim()}"`,
            });
          }

          // 5. CONTACTS UPSERT (POST /api/v1/contacts/upsert)
          // AI agents kunnen een contact opsturen; als het bestaat wordt het geüpdatet, anders aangemaakt!
          if (pathname === '/api/v1/contacts/upsert' && req.method === 'POST') {
            const rawBody = await readBody(req);
            const payload = JSON.parse(rawBody || '{}');
            const email = (payload.email || '').trim().toLowerCase();
            const vvcTag = (payload.vvc_tag || '').trim();

            if (!email && !vvcTag) {
              return sendJson(res, 400, {
                success: false,
                message: 'Geef minimaal een email of vvc_tag mee voor upsert.',
              });
            }

            // Zoeken naar bestaand contact
            const contactsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=100`;
            const fbRes = await fetch(contactsUrl);
            const contactsData = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
            const existingDocs: any[] = (contactsData.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            const match: any = existingDocs.find((c: any) =>
              (email && (c.email || '').toLowerCase() === email) ||
              (vvcTag && (c.vvc_tag || '').toLowerCase() === vvcTag.toLowerCase())
            );

            // Bepaal tags en bedrijfscontext
            const autoCompanyTag = keyMeta && keyMeta.tag !== 'ALL' ? `#${keyMeta.tag.toLowerCase()}` : null;
            const existingCompanyTags = Array.isArray(match?.company_tags) ? match.company_tags : [];
            const newCompanyTags = Array.isArray(payload.company_tags) ? payload.company_tags : [];
            const mergedCompanyTags = Array.from(new Set([...existingCompanyTags, ...newCompanyTags, autoCompanyTag])).filter(Boolean);

            const existingTags = Array.isArray(match?.tags) ? match.tags : [];
            const newTags = Array.isArray(payload.tags) ? payload.tags : [];
            const mergedTags = Array.from(new Set([...existingTags, ...newTags, ...mergedCompanyTags])).filter(Boolean);

            if (match) {
              // UPDATE bestaand contact
              const updatedContact = {
                ...match,
                ...payload,
                company_tags: mergedCompanyTags,
                tags: mergedTags,
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_contacts', match.id, updatedContact);

              return sendJson(res, 200, {
                success: true,
                action: 'updated',
                message: `Bestaand contact ${match.id} succesvol bijgewerkt`,
                data: updatedContact,
              });
            } else {
              // CREATE nieuw contact
              const newId = payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const effectiveVvcTag = vvcTag || `vvc-agt-${Math.random().toString(36).substring(2, 8)}`;
              const newContact = {
                id: newId,
                first_name: payload.first_name || 'Nieuw',
                last_name: payload.last_name || 'Contact',
                email: email || '',
                phone: payload.phone || '',
                company: payload.company || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'Onbekend'),
                title: payload.title || 'Contact',
                status: payload.status || 'lead',
                source: payload.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent API'),
                vvc_tag: effectiveVvcTag,
                company_tags: mergedCompanyTags,
                tags: Array.from(new Set([effectiveVvcTag, ...mergedTags])),
                custom_fields: payload.custom_fields || {},
                notes: payload.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);

              return sendJson(res, 201, {
                success: true,
                action: 'created',
                message: `Nieuw contact ${newId} succesvol aangemaakt in CRMos`,
                data: newContact,
              });
            }
          }

          // 6. CONTACTS: GET (lezen/zoeken), POST (aanmaken), PUT/PATCH (bijwerken)
          if (pathname === '/api/v1/contacts' || pathname.startsWith('/api/v1/contacts/')) {
            const contactIdFromPath = pathname.replace('/api/v1/contacts', '').replace(/^\//, '').trim();

            // GET CONTACTS
            if (req.method === 'GET') {
              // Single Contact ophalen op ID
              if (contactIdFromPath) {
                const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(contactIdFromPath)}`;
                const fbRes = await fetch(singleUrl);
                if (fbRes.ok) {
                  const docJson = (await fbRes.json()) as any;
                  const flat = parseFirestoreFields(docJson.fields || {});
                  return sendJson(res, 200, { success: true, data: { id: contactIdFromPath, ...flat } });
                }
                return sendJson(res, 404, { success: false, message: `Contact ${contactIdFromPath} niet gevonden` });
              }

              // Lijst ophalen met filters
              const tag = parsedUrl.searchParams.get('tag');
              const companyTag = parsedUrl.searchParams.get('company_tag');
              const search = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
              const pageSize = Number(parsedUrl.searchParams.get('limit')) || 100;

              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts?pageSize=${pageSize}`;
              const fbRes = await fetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const contacts = (data.documents || []).map((d: any) => {
                const flat = parseFirestoreFields(d.fields || {});
                const id = d.name.split('/').pop();
                return { id, ...flat };
              });

              let filtered = contacts;

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

            // POST: CONTACT AANMAKEN
            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              const newId = payload.id || `contact_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const effectiveVvcTag = payload.vvc_tag || `vvc-agt-${Math.random().toString(36).substring(2, 8)}`;

              const autoCompanyTag = keyMeta && keyMeta.tag !== 'ALL' ? `#${keyMeta.tag.toLowerCase()}` : null;
              const inputCompanyTags = Array.isArray(payload.company_tags) ? payload.company_tags : [];
              const company_tags = Array.from(new Set([...inputCompanyTags, autoCompanyTag])).filter(Boolean);

              const inputTags = Array.isArray(payload.tags) ? payload.tags : [];
              const tags = Array.from(new Set([effectiveVvcTag, ...inputTags, ...company_tags])).filter(Boolean);

              const newContact = {
                id: newId,
                first_name: payload.first_name || '',
                last_name: payload.last_name || '',
                email: payload.email || '',
                phone: payload.phone || '',
                company: payload.company || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'Onbekend'),
                title: payload.title || 'Contact',
                status: payload.status || 'lead',
                source: payload.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent API'),
                vvc_tag: effectiveVvcTag,
                company_tags,
                tags,
                custom_fields: payload.custom_fields || {},
                notes: payload.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_contacts', newId, newContact);

              return sendJson(res, 201, {
                success: true,
                message: 'Contact succesvol opgeslagen in Cloud Firestore',
                data: newContact,
              });
            }

            // PUT / PATCH: CONTACT BIJWERKEN
            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = contactIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) {
                return sendJson(res, 400, { success: false, message: 'Geef een contact ID op via het pad (/api/v1/contacts/:id) of ?id=...' });
              }

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              // Haal bestaand document op
              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_contacts/${encodeURIComponent(targetId)}`;
              const fbRes = await fetch(singleUrl);
              const existingData = fbRes.ok ? parseFirestoreFields(((await fbRes.json()) as any).fields || {}) : {};

              const merged = {
                ...existingData,
                ...updates,
                id: targetId,
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_contacts', targetId, merged);

              return sendJson(res, 200, {
                success: true,
                message: `Contact ${targetId} succesvol bijgewerkt`,
                data: merged,
              });
            }
          }

          // 7. DEALS: GET, POST (aanmaken), PUT/PATCH (bijwerken)
          if (pathname === '/api/v1/deals' || pathname.startsWith('/api/v1/deals/')) {
            const dealIdFromPath = pathname.replace('/api/v1/deals', '').replace(/^\//, '').trim();

            if (req.method === 'GET') {
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals?pageSize=100`;
              const fbRes = await fetch(firestoreUrl);
              const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
              const deals = (data.documents || []).map((d: any) => ({
                id: d.name.split('/').pop(),
                ...parseFirestoreFields(d.fields || {}),
              }));

              const compFilter = parsedUrl.searchParams.get('company');
              const filtered = compFilter
                ? deals.filter((d: any) => (d.company_name || '').toLowerCase().includes(compFilter.toLowerCase()))
                : deals;

              return sendJson(res, 200, { success: true, count: filtered.length, data: filtered });
            }

            if (req.method === 'POST') {
              const rawBody = await readBody(req);
              const payload = JSON.parse(rawBody || '{}');
              const dealId = payload.id || `deal_agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

              const newDeal = {
                id: dealId,
                name: payload.name || 'Nieuwe Deal',
                value: Number(payload.value) || 0,
                stage: payload.stage || 'lead',
                company_name: payload.company_name || (keyMeta?.company !== 'ALL' ? keyMeta?.company : 'CRMos'),
                contact_id: payload.contact_id || '',
                probability: payload.probability || 20,
                expected_close_date: payload.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_deals', dealId, newDeal);

              return sendJson(res, 201, {
                success: true,
                message: 'Deal succesvol aangemaakt in CRMos',
                data: newDeal,
              });
            }

            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = dealIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) return sendJson(res, 400, { success: false, message: 'Geen deal ID opgegeven' });

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_deals/${encodeURIComponent(targetId)}`;
              const fbRes = await fetch(singleUrl);
              const existing = fbRes.ok ? parseFirestoreFields(((await fbRes.json()) as any).fields || {}) : {};

              const merged = { ...existing, ...updates, id: targetId, updated_at: new Date().toISOString() };
              await saveToFirestoreRest(projectId, 'crm_deals', targetId, merged);

              return sendJson(res, 200, { success: true, message: `Deal ${targetId} bijgewerkt`, data: merged });
            }
          }

          // 8. ACTIVITIES / INTERACTION LOGS (Gespreksnotities, meetings, taken van AI agent)
          if (pathname === '/api/v1/activities') {
            if (req.method === 'GET') {
              const contactId = parsedUrl.searchParams.get('contact_id');
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_activities?pageSize=100`;
              const fbRes = await fetch(firestoreUrl);
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
                created_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'crm_activities', actId, newActivity);

              return sendJson(res, 201, {
                success: true,
                message: 'Activiteit/Gespreksnotitie succesvol gelogd in CRMos',
                data: newActivity,
              });
            }
          }

          // 9. CANDIDATES (Recruitment & No Cure No Pay)
          if (pathname === '/api/v1/candidates' || pathname.startsWith('/api/v1/candidates/')) {
            const candidateIdFromPath = pathname.replace('/api/v1/candidates', '').replace(/^\//, '').trim();

            if (req.method === 'GET') {
              const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recruitment_candidates?pageSize=100`;
              const fbRes = await fetch(firestoreUrl);
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
              const effectiveVvcTag = candidate.vvc_tag || `vvc-cand-${Math.random().toString(36).substring(2, 7)}`;

              const newCand = {
                id: candId,
                first_name: candidate.first_name || '',
                last_name: candidate.last_name || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                status: candidate.status || 'new',
                skills: Array.isArray(candidate.skills) ? candidate.skills : [],
                experience_years: Number(candidate.experience_years) || 3,
                location: candidate.location || '100% Remote',
                source: candidate.source || (keyMeta ? `AI Agent (${keyMeta.name})` : 'AI Agent Funnel'),
                vvc_tag: effectiveVvcTag,
                notes: candidate.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await saveToFirestoreRest(projectId, 'recruitment_candidates', candId, newCand);

              return sendJson(res, 201, {
                success: true,
                message: 'Sollicitatie/Kandidaat succesvol geregistreerd in Cloud Firestore',
                data: newCand,
              });
            }

            if (req.method === 'PUT' || req.method === 'PATCH') {
              const targetId = candidateIdFromPath || parsedUrl.searchParams.get('id');
              if (!targetId) return sendJson(res, 400, { success: false, message: 'Geen kandidaat ID opgegeven' });

              const rawBody = await readBody(req);
              const updates = JSON.parse(rawBody || '{}');

              const singleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recruitment_candidates/${encodeURIComponent(targetId)}`;
              const fbRes = await fetch(singleUrl);
              const existing = fbRes.ok ? parseFirestoreFields(((await fbRes.json()) as any).fields || {}) : {};

              const merged = { ...existing, ...updates, id: targetId, updated_at: new Date().toISOString() };
              await saveToFirestoreRest(projectId, 'recruitment_candidates', targetId, merged);

              return sendJson(res, 200, { success: true, message: `Kandidaat ${targetId} bijgewerkt`, data: merged });
            }
          }

          // 10. TEAMS (Referral Netwerk & Kernleiders)
          if (pathname === '/api/v1/teams') {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/crm_teams`;
            const fbRes = await fetch(firestoreUrl);
            const data = (fbRes.ok ? await fbRes.json() : { documents: [] }) as { documents?: any[] };
            const teams = (data.documents || []).map((d: any) => ({
              id: d.name.split('/').pop(),
              ...parseFirestoreFields(d.fields || {}),
            }));

            return sendJson(res, 200, { success: true, count: teams.length, data: teams });
          }

          // 11. 13 ECOSYSTEM COMPANIES
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
