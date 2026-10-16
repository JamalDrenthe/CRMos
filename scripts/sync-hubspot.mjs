#!/usr/bin/env node
/**
 * CRMos - Direct HubSpot CRM v3 to Google Cloud Firestore Importer
 * Usage: node scripts/sync-hubspot.mjs <HUBSPOT_PRIVATE_APP_TOKEN> [ORG_ID]
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load .env manually if present
const envPath = path.resolve(process.cwd(), '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || envVars.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || envVars.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const token = process.argv[2] || process.env.HUBSPOT_ACCESS_TOKEN || envVars.HUBSPOT_ACCESS_TOKEN;
const orgIdArg = process.argv[3] || 'default_org';

if (!token) {
  console.error('Fout: Geef een HubSpot Service Key of Private App Token op: node scripts/sync-hubspot.mjs <token>');
  process.exit(1);
}

async function authenticateFirebase() {
  const syncEmail = process.env.CRMOS_SYNC_EMAIL || 'hubspot-sync@crmos.one';
  const syncPass = process.env.CRMOS_SYNC_PASS || 'CrmosHubSpotSync2026!';
  try {
    await signInWithEmailAndPassword(auth, syncEmail, syncPass);
    console.log(`Geauthenticeerd bij Firebase als ${syncEmail}`);
  } catch (err) {
    try {
      await createUserWithEmailAndPassword(auth, syncEmail, syncPass);
      console.log(`Service-account aangemaakt en ingelogd bij Firebase als ${syncEmail}`);
    } catch {
      try {
        await signInAnonymously(auth);
        console.log('Anoniem geauthenticeerd bij Firebase');
      } catch (anonErr) {
        console.warn('Waarschuwing: Kon niet automatisch inloggen bij Firebase Auth:', anonErr.message);
      }
    }
  }
}

async function fetchHubSpot(endpoint) {
  const res = await fetch(`https://api.hubapi.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HubSpot API fout (${res.status}): ${txt}`);
  }
  return res.json();
}

async function fetchAllObjects(objectType, properties, associations = []) {
  const all = [];
  let after = undefined;
  let pages = 0;

  while (pages < 100) {
    pages++;
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

    const data = await fetchHubSpot(`/crm/v3/objects/${objectType}?${params.toString()}`);
    if (data.results) {
      all.push(...data.results);
    }
    if (data.paging?.next?.after) {
      after = data.paging.next.after;
    } else {
      break;
    }
  }
  return all;
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapStatus(stage, leadStatus) {
  const s = (stage || '').toLowerCase();
  const l = (leadStatus || '').toLowerCase();
  if (s === 'customer' || s === 'evangelist') return 'customer';
  if (s === 'opportunity' || s === 'salesqualifiedlead' || s === 'marketingqualifiedlead' || l === 'open_deal') {
    return 'prospect';
  }
  if (l === 'unqualified' || s === 'other') return 'churned';
  return 'lead';
}

function mapDealStage(hsStage) {
  const s = (hsStage || '').toLowerCase();
  if (s.includes('closedwon') || s.includes('won')) return { stage: 'closed-won', probability: 100 };
  if (s.includes('closedlost') || s.includes('lost')) return { stage: 'closed-lost', probability: 0 };
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

async function purgeMockDataFromFirestore() {
  const mockIds = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);
  const mockEmails = new Set([
    'jan.devries@techcorp.nl',
    'lisa@innovate.io',
    'p.bakker@globaltrade.com',
    'sophie.jansen@startup.nl',
    'm.visser@enterprise.nl',
  ]);
  const mockNames = new Set([
    'Jan de Vries',
    'Lisa van den Berg',
    'Pieter Bakker',
    'Sophie Jansen',
    'Mark Visser',
    'TechCorp B.V.',
    'Innovate.io',
    'GlobalTrade International',
    'StartupNL',
    'Enterprise Solutions B.V.',
    'TechCorp Enterprise License',
    'Innovate.io Cloud Migration',
    'GlobalTrade CRM Implementation',
    'StartupNL Starter Package',
    'Enterprise Annual Contract',
  ]);

  const cols = [
    'crm_contacts',
    'crm_companies',
    'crm_deals',
    'crm_activities',
    'crm_candidates',
    'crm_jobs',
    'crm_calls',
    'crm_campaigns',
    'crm_products',
  ];

  let deleted = 0;
  for (const colName of cols) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        const data = d.data();
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const isMock =
          mockIds.has(d.id) ||
          mockIds.has(String(data.id || '')) ||
          mockEmails.has(String(data.email || '').toLowerCase()) ||
          mockNames.has(String(data.name || '')) ||
          mockNames.has(fullName) ||
          data.is_mock === true;
        if (isMock) {
          await deleteDoc(doc(db, colName, d.id));
          deleted++;
        }
      }
    } catch {
      // ignore
    }
  }
  if (deleted > 0) {
    console.log(`   -> ${deleted} oude mock/demo records gewist uit Firestore.`);
  }
}

async function run() {
  console.log('=== CRMos HubSpot -> Firestore Synchronisatie Gestart ===');
  await authenticateFirebase();
  await purgeMockDataFromFirestore();

  // Discover all org_ids in users/organizations so all active user sessions see the imported data
  const orgIds = new Set([orgIdArg, 'default_org', 'crmosone-dev', 'org1']);
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((u) => {
      const d = u.data();
      if (d.org_id) orgIds.add(d.org_id);
    });
  } catch {
    // ignore if users collection empty
  }
  const targetOrgIds = Array.from(orgIds);
  console.log('Doel organisatie IDs:', targetOrgIds.join(', '));

  // 1. Companies
  console.log('1. Bedrijven ophalen uit HubSpot...');
  const hsCompanies = await fetchAllObjects('companies', [
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
  ]);
  console.log(`   -> ${hsCompanies.length} bedrijven gevonden in HubSpot.`);

  const companyNameMap = new Map();
  for (const item of hsCompanies) {
    const hsId = String(item.id);
    const p = item.properties || {};
    const name = p.name || p.domain || `Bedrijf #${hsId}`;
    companyNameMap.set(hsId, name);

    for (const orgId of targetOrgIds) {
      const docId = orgId === 'default_org' ? `hs_comp_${hsId}` : `hs_comp_${orgId}_${hsId}`;
      await setDoc(
        doc(db, 'crm_companies', docId),
        {
          id: docId,
          org_id: orgId,
          name,
          domain: p.domain || '',
          industry: p.industry || '',
          size: p.numberofemployees ? String(p.numberofemployees) : '',
          revenue: p.annualrevenue ? `€${Number(p.annualrevenue).toLocaleString('nl-NL')}` : '',
          phone: p.phone || '',
          website: p.website || (p.domain ? `https://${p.domain}` : ''),
          linkedin: p.linkedin_company_page || '',
          address: {
            street: p.address || '',
            city: p.city || '',
            state: p.state || '',
            postal_code: p.zip || '',
            country: p.country || '',
          },
          contacts_count: 0,
          deals_count: 0,
          created_at: p.createdate || new Date().toISOString(),
          updated_at: p.hs_lastmodifieddate || new Date().toISOString(),
          _firestore_timestamp: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  // 2. Contacts
  console.log('2. Contacten ophalen uit HubSpot...');
  const hsContacts = await fetchAllObjects(
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
    ['companies']
  );
  console.log(`   -> ${hsContacts.length} contacten gevonden in HubSpot.`);

  const contactNameMap = new Map();
  for (const item of hsContacts) {
    const hsId = String(item.id);
    const p = item.properties || {};
    const firstName = p.firstname || (p.email ? p.email.split('@')[0] : 'Onbekend');
    const lastName = p.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    contactNameMap.set(hsId, fullName);

    let companyName = p.company || '';
    const assocCompId = item.associations?.companies?.results?.[0]?.id;
    if (!companyName && assocCompId) {
      companyName = companyNameMap.get(String(assocCompId)) || '';
    }

    const tags = ['hubspot'];
    if (p.lifecyclestage) tags.push(p.lifecyclestage.toLowerCase());
    if (p.hs_lead_status) tags.push(p.hs_lead_status.toLowerCase());

    for (const orgId of targetOrgIds) {
      const docId = orgId === 'default_org' ? `hs_cont_${hsId}` : `hs_cont_${orgId}_${hsId}`;
      await setDoc(
        doc(db, 'crm_contacts', docId),
        {
          id: docId,
          org_id: orgId,
          first_name: firstName,
          last_name: lastName,
          email: p.email || '',
          phone: p.phone || p.mobilephone || '',
          mobile: p.mobilephone || '',
          company: companyName,
          title: p.jobtitle || '',
          industry: p.industry || '',
          status: mapStatus(p.lifecyclestage, p.hs_lead_status),
          source: 'HubSpot CRM',
          tags,
          address: {
            street: p.address || '',
            city: p.city || '',
            state: p.state || '',
            postal_code: p.zip || '',
            country: p.country || '',
          },
          custom_fields: {
            hubspot_id: hsId,
            lifecyclestage: p.lifecyclestage || '',
            lead_status: p.hs_lead_status || '',
          },
          last_contact_at: p.notes_last_updated || p.lastmodifieddate || new Date().toISOString(),
          created_at: p.createdate || new Date().toISOString(),
          updated_at: p.lastmodifieddate || new Date().toISOString(),
          _firestore_timestamp: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  // 3. Deals
  console.log('3. Deals ophalen uit HubSpot...');
  const hsDeals = await fetchAllObjects(
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
    ['contacts', 'companies']
  );
  console.log(`   -> ${hsDeals.length} deals gevonden in HubSpot.`);

  for (const item of hsDeals) {
    const hsId = String(item.id);
    const p = item.properties || {};
    const mapped = mapDealStage(p.dealstage);
    const rawCompId = item.associations?.companies?.results?.[0]?.id;
    const rawContId = item.associations?.contacts?.results?.[0]?.id;

    for (const orgId of targetOrgIds) {
      const docId = orgId === 'default_org' ? `hs_deal_${hsId}` : `hs_deal_${orgId}_${hsId}`;
      await setDoc(
        doc(db, 'crm_deals', docId),
        {
          id: docId,
          org_id: orgId,
          name: p.dealname || `Deal #${hsId}`,
          company_id: rawCompId ? `hs_comp_${rawCompId}` : '',
          company_name: (rawCompId && companyNameMap.get(String(rawCompId))) || '',
          contact_id: rawContId ? `hs_cont_${rawContId}` : '',
          contact_name: (rawContId && contactNameMap.get(String(rawContId))) || '',
          value: p.amount ? Number(p.amount) : 0,
          currency: p.hs_currency || 'EUR',
          stage: mapped.stage,
          pipeline_id: '1',
          probability: p.hs_deal_stage_probability
            ? Math.round(Number(p.hs_deal_stage_probability) * 100)
            : mapped.probability,
          expected_close_date: p.closedate ? p.closedate.split('T')[0] : '',
          source: 'HubSpot CRM',
          assigned_to: 'user1',
          tags: ['hubspot', p.dealstage || 'deal'].filter(Boolean),
          notes: p.description || '',
          activities: [],
          created_at: p.createdate || new Date().toISOString(),
          updated_at: p.hs_lastmodifieddate || new Date().toISOString(),
          _firestore_timestamp: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  // 4. Calls (optional scope)
  try {
    console.log('4. Gesprekken (Calls) ophalen uit HubSpot...');
    const hsCalls = await fetchAllObjects(
      'calls',
      [
        'hs_call_title',
        'hs_call_body',
        'hs_call_duration',
        'hs_call_direction',
        'hs_call_status',
        'hs_call_to_number',
        'hs_call_from_number',
        'hs_timestamp',
        'hs_createdate',
      ],
      ['contacts']
    );
    console.log(`   -> ${hsCalls.length} gesprekken gevonden in HubSpot.`);
    for (const item of hsCalls) {
      const hsId = String(item.id);
      const p = item.properties || {};
      const rawContId = item.associations?.contacts?.results?.[0]?.id;
      const contactName = (rawContId && contactNameMap.get(String(rawContId))) || 'HubSpot Contact';
      const durationSec = p.hs_call_duration ? Math.round(Number(p.hs_call_duration) / 1000) : 0;

      for (const orgId of targetOrgIds) {
        const callDocId = orgId === 'default_org' ? `hs_call_${hsId}` : `hs_call_${orgId}_${hsId}`;
        await setDoc(
          doc(db, 'crm_calls', callDocId),
          {
            id: callDocId,
            org_id: orgId,
            contact_id: rawContId ? `hs_cont_${rawContId}` : '',
            contact_name: contactName,
            contact_phone: p.hs_call_to_number || p.hs_call_from_number || '',
            agent_id: 'user1',
            agent_name: 'HubSpot Sync',
            direction: (p.hs_call_direction || '').toUpperCase() === 'INBOUND' ? 'inbound' : 'outbound',
            status: 'completed',
            duration: durationSec,
            notes: stripHtml(p.hs_call_body),
            outcome: p.hs_call_title || 'HubSpot Call',
            started_at: p.hs_timestamp || p.hs_createdate || new Date().toISOString(),
            ended_at: p.hs_timestamp || p.hs_createdate || new Date().toISOString(),
            _firestore_timestamp: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  } catch (e) {
    console.log('   -> Calls overgeslagen (geen call-scope of leeg):', e.message);
  }

  // 5. Products (optional scope)
  try {
    console.log('5. Producten ophalen uit HubSpot...');
    const hsProducts = await fetchAllObjects('products', [
      'name',
      'description',
      'price',
      'hs_sku',
      'hs_cost_of_goods_sold',
      'recurringbillingfrequency',
      'createdate',
    ]);
    console.log(`   -> ${hsProducts.length} producten gevonden in HubSpot.`);
    for (const item of hsProducts) {
      const hsId = String(item.id);
      const p = item.properties || {};
      for (const orgId of targetOrgIds) {
        const prodDocId = orgId === 'default_org' ? `hs_prod_${hsId}` : `hs_prod_${orgId}_${hsId}`;
        await setDoc(
          doc(db, 'crm_products', prodDocId),
          {
            id: prodDocId,
            org_id: orgId,
            name: p.name || `Product #${hsId}`,
            sku: p.hs_sku || `HS-${hsId}`,
            category: 'HubSpot Catalog',
            price: p.price ? Number(p.price) : 0,
            currency: 'EUR',
            unit: p.recurringbillingfrequency ? `per ${p.recurringbillingfrequency}` : 'eenmalig',
            active: true,
            description: stripHtml(p.description),
            created_at: p.createdate || new Date().toISOString(),
            _firestore_timestamp: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  } catch (e) {
    console.log('   -> Producten overgeslagen (geen product-scope of leeg):', e.message);
  }

  console.log('=== HubSpot Synchronisatie Voltooid! ===');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fout tijdens HubSpot import:', err);
  process.exit(1);
});
