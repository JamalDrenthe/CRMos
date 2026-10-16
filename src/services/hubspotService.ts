import {
  saveContactToFirestore,
  saveCompanyToFirestore,
  saveDealToFirestore,
  saveActivityToFirestore,
  saveCallToFirestore,
  saveProductToFirestore,
  purgeDemoAndMockDataFromFirestore,
} from '@/services/firestoreService';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Contact, Company, Deal, Activity, Call, Product } from '@/types';

export interface HubSpotSyncProgress {
  step: string;
  contactsCount: number;
  companiesCount: number;
  dealsCount: number;
  activitiesCount: number;
  callsCount: number;
  productsCount: number;
  isComplete: boolean;
  error?: string;
}

export interface HubSpotConfig {
  accessToken: string;
  portalId?: string;
  region?: 'eu1' | 'na1';
  lastSyncAt?: string;
  autoSync: boolean;
  stats?: {
    contacts: number;
    companies: number;
    deals: number;
    activities: number;
    calls: number;
    products: number;
  };
}

const HUBSPOT_STORAGE_KEY = 'crmos-hubspot-config';

export function getSavedHubSpotConfig(): HubSpotConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HUBSPOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveHubSpotConfig(config: HubSpotConfig, orgId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(HUBSPOT_STORAGE_KEY, JSON.stringify(config));
  }
  if (isFirebaseConfigured()) {
    try {
      await setDoc(
        doc(db, 'crm_integrations', `${orgId}_hubspot`),
        {
          ...config,
          org_id: orgId,
          updated_at: new Date().toISOString(),
          _firestore_timestamp: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Kon HubSpot configuratie niet in Firestore opslaan:', err);
    }
  }
}

export async function loadHubSpotConfigFromFirestore(orgId: string): Promise<HubSpotConfig | null> {
  if (!isFirebaseConfigured()) return getSavedHubSpotConfig();
  try {
    const snap = await getDoc(doc(db, 'crm_integrations', `${orgId}_hubspot`));
    if (snap.exists()) {
      const data = snap.data() as HubSpotConfig;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(HUBSPOT_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('Kon HubSpot config niet laden uit Firestore:', err);
  }
  return getSavedHubSpotConfig();
}

// Helper for HubSpot API requests (tries direct first, then CORS proxy fallback for browser environments)
async function fetchHubSpotEndpoint(path: string, accessToken: string): Promise<Record<string, unknown>> {
  const cleanToken = accessToken.trim();
  const targetUrl = `https://api.hubapi.com${path}`;
  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HubSpot API (${response.status}): ${errText}`);
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (directError) {
    // If browser CORS blocks direct api.hubapi.com call, try corsproxy fallback
    if (directError instanceof TypeError && directError.message.toLowerCase().includes('fetch')) {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const proxyRes = await fetch(proxyUrl, { headers });
      if (!proxyRes.ok) {
        const errText = await proxyRes.text();
        throw new Error(`HubSpot API via proxy (${proxyRes.status}): ${errText}`);
      }
      return (await proxyRes.json()) as Record<string, unknown>;
    }
    throw directError;
  }
}

// Fetch all pages of a HubSpot CRM v3 object
async function fetchAllHubSpotObjects(
  objectType: string,
  properties: string[],
  accessToken: string,
  associations: string[] = []
): Promise<Array<Record<string, unknown>>> {
  const results: Array<Record<string, unknown>> = [];
  let after: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 50; // Up to 5,000 records per object type

  while (pageCount < maxPages) {
    pageCount++;
    const params = new URLSearchParams({
      limit: '100',
      properties: properties.join(','),
    });
    if (associations.length > 0) {
      params.set('associations', associations.join(','));
    }
    if (after) {
      params.set('after', after);
    }

    const data = await fetchHubSpotEndpoint(`/crm/v3/objects/${objectType}?${params.toString()}`, accessToken);
    const pageResults = (data.results as Array<Record<string, unknown>>) || [];
    results.push(...pageResults);

    const paging = data.paging as { next?: { after?: string } } | undefined;
    if (paging?.next?.after) {
      after = paging.next.after;
    } else {
      break;
    }
  }

  return results;
}

function mapHubSpotLifecycleToStatus(stage?: string, leadStatus?: string): Contact['status'] {
  const s = (stage || '').toLowerCase();
  const l = (leadStatus || '').toLowerCase();
  if (s === 'customer' || s === 'evangelist') return 'customer';
  if (s === 'opportunity' || s === 'salesqualifiedlead' || s === 'marketingqualifiedlead' || l === 'open_deal') {
    return 'prospect';
  }
  if (l === 'unqualified' || s === 'other') return 'churned';
  return 'lead';
}

function mapHubSpotDealStage(hsStage?: string): { stage: string; probability: number } {
  const s = (hsStage || '').toLowerCase();
  if (s.includes('closedwon') || s.includes('won')) {
    return { stage: 'closed-won', probability: 100 };
  }
  if (s.includes('closedlost') || s.includes('lost')) {
    return { stage: 'closed-lost', probability: 0 };
  }
  if (s.includes('contractsent') || s.includes('decisionmakerboughtin') || s.includes('negotiation')) {
    return { stage: 'negotiation', probability: 75 };
  }
  if (s.includes('presentationscheduled') || s.includes('proposal') || s.includes('quote')) {
    return { stage: 'proposal', probability: 50 };
  }
  if (s.includes('qualifiedtobuy') || s.includes('qualified') || s.includes('appointmentscheduled')) {
    return { stage: 'qualified', probability: 25 };
  }
  return { stage: 'lead', probability: 10 };
}

function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function syncAllDataFromHubSpot(
  accessToken: string,
  orgId: string,
  onProgress?: (progress: HubSpotSyncProgress) => void
): Promise<{
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  activities: Activity[];
  calls: Call[];
  products: Product[];
}> {
  const progress: HubSpotSyncProgress = {
    step: 'Mock data opschonen & verbinding testen met HubSpot...',
    contactsCount: 0,
    companiesCount: 0,
    dealsCount: 0,
    activitiesCount: 0,
    callsCount: 0,
    productsCount: 0,
    isComplete: false,
  };
  onProgress?.({ ...progress });

  // 1. Purge any old mock/demo records first
  await purgeDemoAndMockDataFromFirestore(orgId);

  // 2. Fetch Companies first so we can map Company IDs -> Names for Contacts & Deals
  progress.step = 'Bedrijven (Companies) ophalen uit HubSpot...';
  onProgress?.({ ...progress });

  const hsCompanies = await fetchAllHubSpotObjects(
    'companies',
    [
      'name',
      'domain',
      'industry',
      'numberofemployees',
      'annualrevenue',
      'phone',
      'website',
      'city',
      'state',
      'country',
      'address',
      'zip',
      'linkedin_company_page',
      'createdate',
      'hs_lastmodifieddate',
    ],
    accessToken
  );

  const companyNameMap = new Map<string, string>();
  const companies: Company[] = [];

  for (const item of hsCompanies) {
    const hsId = String(item.id);
    const props = (item.properties as Record<string, string | null>) || {};
    const name = props.name || props.domain || `Bedrijf #${hsId}`;
    companyNameMap.set(`hs_comp_${hsId}`, name);
    companyNameMap.set(hsId, name);

    const company: Company = {
      id: `hs_comp_${hsId}`,
      name,
      domain: props.domain || undefined,
      industry: props.industry || undefined,
      size: props.numberofemployees ? String(props.numberofemployees) : undefined,
      revenue: props.annualrevenue ? `€${Number(props.annualrevenue).toLocaleString('nl-NL')}` : undefined,
      phone: props.phone || undefined,
      website: props.website || (props.domain ? `https://${props.domain}` : undefined),
      linkedin: props.linkedin_company_page || undefined,
      address: {
        street: props.address || undefined,
        city: props.city || undefined,
        state: props.state || undefined,
        postal_code: props.zip || undefined,
        country: props.country || undefined,
      },
      contacts_count: 0,
      deals_count: 0,
      created_at: props.createdate || new Date().toISOString(),
      updated_at: props.hs_lastmodifieddate || new Date().toISOString(),
    };

    companies.push(company);
    await saveCompanyToFirestore(company, orgId);
    progress.companiesCount = companies.length;
    onProgress?.({ ...progress });
  }

  // 3. Fetch Contacts
  progress.step = 'Contacten & Leads ophalen uit HubSpot...';
  onProgress?.({ ...progress });

  const hsContacts = await fetchAllHubSpotObjects(
    'contacts',
    [
      'firstname',
      'lastname',
      'email',
      'phone',
      'mobilephone',
      'company',
      'jobtitle',
      'industry',
      'lifecyclestage',
      'hs_lead_status',
      'city',
      'state',
      'country',
      'address',
      'zip',
      'hs_linkedin_url',
      'notes_last_updated',
      'createdate',
      'lastmodifieddate',
    ],
    accessToken,
    ['companies']
  );

  const contactNameMap = new Map<string, string>();
  const contacts: Contact[] = [];

  for (const item of hsContacts) {
    const hsId = String(item.id);
    const props = (item.properties as Record<string, string | null>) || {};
    const firstName = props.firstname || (props.email ? props.email.split('@')[0] : 'Onbekend');
    const lastName = props.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    contactNameMap.set(`hs_cont_${hsId}`, fullName);
    contactNameMap.set(hsId, fullName);

    // Check associated company if props.company is empty
    let companyName = props.company || undefined;
    const assocCompanies = (item.associations as Record<string, { results?: Array<{ id: string }> }> | undefined)?.companies?.results;
    if (!companyName && assocCompanies && assocCompanies.length > 0) {
      companyName = companyNameMap.get(assocCompanies[0].id);
    }

    const tags: string[] = ['hubspot'];
    if (props.lifecyclestage) tags.push(props.lifecyclestage.toLowerCase());
    if (props.hs_lead_status) tags.push(props.hs_lead_status.toLowerCase());

    const contact: Contact = {
      id: `hs_cont_${hsId}`,
      first_name: firstName,
      last_name: lastName,
      email: props.email || '',
      phone: props.phone || props.mobilephone || undefined,
      mobile: props.mobilephone || undefined,
      company: companyName,
      title: props.jobtitle || undefined,
      industry: props.industry || undefined,
      status: mapHubSpotLifecycleToStatus(props.lifecyclestage || undefined, props.hs_lead_status || undefined),
      source: 'HubSpot CRM',
      tags,
      address: {
        street: props.address || undefined,
        city: props.city || undefined,
        state: props.state || undefined,
        postal_code: props.zip || undefined,
        country: props.country || undefined,
      },
      social_profiles: props.hs_linkedin_url ? { linkedin: props.hs_linkedin_url } : undefined,
      custom_fields: {
        hubspot_id: hsId,
        lifecyclestage: props.lifecyclestage || '',
        lead_status: props.hs_lead_status || '',
      },
      last_contact_at: props.notes_last_updated || props.lastmodifieddate || undefined,
      created_at: props.createdate || new Date().toISOString(),
      updated_at: props.lastmodifieddate || new Date().toISOString(),
    };

    contacts.push(contact);
    await saveContactToFirestore(contact, orgId);
    progress.contactsCount = contacts.length;
    onProgress?.({ ...progress });
  }

  // 4. Fetch Deals
  progress.step = 'Deals & Pijplijnen ophalen uit HubSpot...';
  onProgress?.({ ...progress });

  const hsDeals = await fetchAllHubSpotObjects(
    'deals',
    [
      'dealname',
      'amount',
      'dealstage',
      'pipeline',
      'closedate',
      'hs_deal_stage_probability',
      'description',
      'hs_currency',
      'createdate',
      'hs_lastmodifieddate',
    ],
    accessToken,
    ['contacts', 'companies']
  );

  const deals: Deal[] = [];

  for (const item of hsDeals) {
    const hsId = String(item.id);
    const props = (item.properties as Record<string, string | null>) || {};
    const mappedStage = mapHubSpotDealStage(props.dealstage || undefined);

    const assoc = item.associations as Record<string, { results?: Array<{ id: string }> }> | undefined;
    const rawCompId = assoc?.companies?.results?.[0]?.id;
    const rawContId = assoc?.contacts?.results?.[0]?.id;

    const companyId = rawCompId ? `hs_comp_${rawCompId}` : '';
    const contactId = rawContId ? `hs_cont_${rawContId}` : undefined;

    const deal: Deal = {
      id: `hs_deal_${hsId}`,
      name: props.dealname || `HubSpot Deal #${hsId}`,
      company_id: companyId,
      company_name: (rawCompId && companyNameMap.get(rawCompId)) || undefined,
      contact_id: contactId,
      contact_name: (rawContId && contactNameMap.get(rawContId)) || undefined,
      value: props.amount ? Number(props.amount) : 0,
      currency: props.hs_currency || 'EUR',
      stage: mappedStage.stage,
      pipeline_id: '1',
      probability: props.hs_deal_stage_probability
        ? Math.round(Number(props.hs_deal_stage_probability) * 100)
        : mappedStage.probability,
      expected_close_date: props.closedate ? props.closedate.split('T')[0] : undefined,
      source: 'HubSpot CRM',
      assigned_to: 'user1',
      tags: ['hubspot', props.dealstage || 'deal'].filter(Boolean),
      notes: props.description || undefined,
      activities: [],
      created_at: props.createdate || new Date().toISOString(),
      updated_at: props.hs_lastmodifieddate || new Date().toISOString(),
    };

    deals.push(deal);
    await saveDealToFirestore(deal, orgId);
    progress.dealsCount = deals.length;
    onProgress?.({ ...progress });
  }

  // 5. Fetch Calls, Tasks & Notes
  progress.step = 'Gesprekken (Calls), Taken & Notities ophalen uit HubSpot...';
  onProgress?.({ ...progress });

  const activities: Activity[] = [];
  const calls: Call[] = [];

  try {
    const hsCalls = await fetchAllHubSpotObjects(
      'calls',
      [
        'hs_call_title',
        'hs_call_body',
        'hs_call_duration',
        'hs_call_from_number',
        'hs_call_to_number',
        'hs_call_status',
        'hs_call_direction',
        'hs_timestamp',
        'hs_call_disposition',
      ],
      accessToken,
      ['contacts', 'deals']
    );

    for (const item of hsCalls) {
      const hsId = String(item.id);
      const props = (item.properties as Record<string, string | null>) || {};
      const assoc = item.associations as Record<string, { results?: Array<{ id: string }> }> | undefined;
      const rawContId = assoc?.contacts?.results?.[0]?.id;
      const rawDealId = assoc?.deals?.results?.[0]?.id;

      const callObj: Call = {
        id: `hs_call_${hsId}`,
        call_sid: `HS-${hsId}`,
        direction: (props.hs_call_direction || '').toLowerCase() === 'inbound' ? 'inbound' : 'outbound',
        from_number: props.hs_call_from_number || '+31',
        to_number: props.hs_call_to_number || 'Onbekend',
        contact_id: rawContId ? `hs_cont_${rawContId}` : undefined,
        contact_name: (rawContId && contactNameMap.get(rawContId)) || props.hs_call_title || 'HubSpot Contact',
        status: 'completed',
        duration: props.hs_call_duration ? Math.round(Number(props.hs_call_duration) / 1000) : 0,
        notes: stripHtml(props.hs_call_body || undefined),
        disposition: props.hs_call_disposition || 'Completed',
        agent_id: 'user1',
        started_at: props.hs_timestamp || new Date().toISOString(),
      };

      calls.push(callObj);
      await saveCallToFirestore(callObj, orgId);
      progress.callsCount = calls.length;

      const activity: Activity = {
        id: `hs_act_call_${hsId}`,
        type: 'call',
        title: props.hs_call_title || 'HubSpot Telefoongesprek',
        description: stripHtml(props.hs_call_body || undefined),
        status: 'completed',
        due_date: props.hs_timestamp || new Date().toISOString(),
        completed_at: props.hs_timestamp || new Date().toISOString(),
        assigned_to: 'user1',
        related_to: rawContId
          ? { type: 'contact', id: `hs_cont_${rawContId}` }
          : rawDealId
          ? { type: 'deal', id: `hs_deal_${rawDealId}` }
          : { type: 'contact', id: contacts[0]?.id || 'hs' },
        created_at: props.hs_timestamp || new Date().toISOString(),
        updated_at: props.hs_timestamp || new Date().toISOString(),
      };

      activities.push(activity);
      await saveActivityToFirestore(activity, orgId);
      progress.activitiesCount = activities.length;
      onProgress?.({ ...progress });
    }
  } catch (err) {
    console.warn('Calls scope niet beschikbaar of leeg in HubSpot:', err);
  }

  try {
    const hsTasks = await fetchAllHubSpotObjects(
      'tasks',
      ['hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_timestamp'],
      accessToken,
      ['contacts', 'deals', 'companies']
    );

    for (const item of hsTasks) {
      const hsId = String(item.id);
      const props = (item.properties as Record<string, string | null>) || {};
      const assoc = item.associations as Record<string, { results?: Array<{ id: string }> }> | undefined;
      const rawContId = assoc?.contacts?.results?.[0]?.id;
      const rawDealId = assoc?.deals?.results?.[0]?.id;
      const rawCompId = assoc?.companies?.results?.[0]?.id;

      const isCompleted = (props.hs_task_status || '').toUpperCase() === 'COMPLETED';

      const activity: Activity = {
        id: `hs_act_task_${hsId}`,
        type: 'task',
        title: props.hs_task_subject || 'HubSpot Taak',
        description: stripHtml(props.hs_task_body || undefined),
        status: isCompleted ? 'completed' : 'pending',
        due_date: props.hs_timestamp || new Date().toISOString(),
        completed_at: isCompleted ? props.hs_timestamp || new Date().toISOString() : undefined,
        assigned_to: 'user1',
        related_to: rawContId
          ? { type: 'contact', id: `hs_cont_${rawContId}` }
          : rawDealId
          ? { type: 'deal', id: `hs_deal_${rawDealId}` }
          : rawCompId
          ? { type: 'company', id: `hs_comp_${rawCompId}` }
          : { type: 'contact', id: contacts[0]?.id || 'hs' },
        created_at: props.hs_timestamp || new Date().toISOString(),
        updated_at: props.hs_timestamp || new Date().toISOString(),
      };

      activities.push(activity);
      await saveActivityToFirestore(activity, orgId);
      progress.activitiesCount = activities.length;
      onProgress?.({ ...progress });
    }
  } catch (err) {
    console.warn('Tasks scope niet beschikbaar of leeg in HubSpot:', err);
  }

  try {
    const hsNotes = await fetchAllHubSpotObjects(
      'notes',
      ['hs_note_body', 'hs_timestamp'],
      accessToken,
      ['contacts', 'deals', 'companies']
    );

    for (const item of hsNotes) {
      const hsId = String(item.id);
      const props = (item.properties as Record<string, string | null>) || {};
      const assoc = item.associations as Record<string, { results?: Array<{ id: string }> }> | undefined;
      const rawContId = assoc?.contacts?.results?.[0]?.id;
      const rawDealId = assoc?.deals?.results?.[0]?.id;

      const cleanBody = stripHtml(props.hs_note_body || undefined);
      if (!cleanBody) continue;

      const activity: Activity = {
        id: `hs_act_note_${hsId}`,
        type: 'note',
        title: cleanBody.slice(0, 60) + (cleanBody.length > 60 ? '...' : ''),
        description: cleanBody,
        status: 'completed',
        due_date: props.hs_timestamp || new Date().toISOString(),
        completed_at: props.hs_timestamp || new Date().toISOString(),
        assigned_to: 'user1',
        related_to: rawContId
          ? { type: 'contact', id: `hs_cont_${rawContId}` }
          : rawDealId
          ? { type: 'deal', id: `hs_deal_${rawDealId}` }
          : { type: 'contact', id: contacts[0]?.id || 'hs' },
        created_at: props.hs_timestamp || new Date().toISOString(),
        updated_at: props.hs_timestamp || new Date().toISOString(),
      };

      activities.push(activity);
      await saveActivityToFirestore(activity, orgId);
      progress.activitiesCount = activities.length;
      onProgress?.({ ...progress });
    }
  } catch (err) {
    console.warn('Notes scope niet beschikbaar of leeg in HubSpot:', err);
  }

  // 6. Fetch Products
  progress.step = 'Producten ophalen uit HubSpot...';
  onProgress?.({ ...progress });

  const products: Product[] = [];
  try {
    const hsProducts = await fetchAllHubSpotObjects(
      'products',
      ['name', 'description', 'hs_sku', 'price', 'createdate'],
      accessToken
    );

    for (const item of hsProducts) {
      const hsId = String(item.id);
      const props = (item.properties as Record<string, string | null>) || {};
      const product: Product = {
        id: `hs_prod_${hsId}`,
        name: props.name || `Product #${hsId}`,
        description: props.description || undefined,
        sku: props.hs_sku || `HS-${hsId}`,
        price: props.price ? Number(props.price) : 0,
        currency: 'EUR',
        category: 'HubSpot Product',
        is_active: true,
        created_at: props.createdate || new Date().toISOString(),
      };
      products.push(product);
      await saveProductToFirestore(product, orgId);
      progress.productsCount = products.length;
      onProgress?.({ ...progress });
    }
  } catch (err) {
    console.warn('Products scope niet beschikbaar of leeg in HubSpot:', err);
  }

  // Update company counts based on imported contacts and deals
  for (const comp of companies) {
    const cCount = contacts.filter((c) => c.company?.toLowerCase() === comp.name.toLowerCase()).length;
    const dCount = deals.filter((d) => d.company_id === comp.id || d.company_name?.toLowerCase() === comp.name.toLowerCase()).length;
    if (cCount > 0 || dCount > 0) {
      comp.contacts_count = cCount;
      comp.deals_count = dCount;
      await saveCompanyToFirestore(comp, orgId);
    }
  }

  // Save HubSpot sync config
  await saveHubSpotConfig(
    {
      accessToken,
      lastSyncAt: new Date().toISOString(),
      autoSync: true,
      stats: {
        contacts: contacts.length,
        companies: companies.length,
        deals: deals.length,
        activities: activities.length,
        calls: calls.length,
        products: products.length,
      },
    },
    orgId
  );

  progress.step = 'HubSpot synchronisatie succesvol voltooid!';
  progress.isComplete = true;
  onProgress?.({ ...progress });

  return { contacts, companies, deals, activities, calls, products };
}
