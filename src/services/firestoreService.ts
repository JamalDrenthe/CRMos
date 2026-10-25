import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  type Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { 
  Contact, 
  Company, 
  Deal, 
  Activity, 
  Candidate, 
  Job, 
  Campaign, 
  Call, 
  Quote, 
  Product,
  Territory,
  D2DAddressPin,
} from '@/types';

// Collection Names
export const COLLECTIONS = {
  CONTACTS: 'crm_contacts',
  COMPANIES: 'crm_companies',
  DEALS: 'crm_deals',
  ACTIVITIES: 'crm_activities',
  CANDIDATES: 'crm_candidates',
  JOBS: 'crm_jobs',
  CAMPAIGNS: 'crm_campaigns',
  CALLS: 'crm_calls',
  QUOTES: 'crm_quotes',
  PRODUCTS: 'crm_products',
  TERRITORIES: 'crm_territories',
  D2D_PINS: 'crm_d2d_pins',
  VVC_REGISTRY: 'crm_vvc_registry',
  VVC_SYNC_CODES: 'vvc_sync_codes',
};

// ====================================================
// CONTACTS
// ====================================================

export async function fetchContactsFromFirestore(orgId: string): Promise<Contact[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.CONTACTS), 
      where('org_id', '==', orgId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Contact));
  } catch (err) {
    console.error('Fout bij ophalen van contacten uit Firestore:', err);
    return [];
  }
}

export async function saveContactToFirestore(contact: Contact, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const vvcTag =
      contact.vvc_tag ||
      contact.tags?.find((t) => typeof t === 'string' && t.toLowerCase().startsWith('vvc-')) ||
      `vvc-${contact.id.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

    const docRef = doc(db, COLLECTIONS.CONTACTS, contact.id);
    await setDoc(docRef, {
      ...contact,
      vvc_tag: vvcTag,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });

    // Registreer unieke VVC communicatie tag direct in zowel vvc_sync_codes als crm_vvc_registry voor VVC API communicatie
    const vvcPayload = {
      vvc_tag: vvcTag,
      registration_type: 'contact',
      entity_id: contact.id,
      contact_id: contact.id,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      email: contact.email || '',
      phone: contact.phone || contact.mobile || '',
      company: contact.company || contact.company_name || '',
      title: contact.title || '',
      status: contact.status || 'lead',
      source: contact.source || 'CRMos',
      location: contact.address?.city || '',
      org_id: orgId,
      created_at: contact.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.VVC_SYNC_CODES, vvcTag), vvcPayload, { merge: true });
    await setDoc(doc(db, COLLECTIONS.VVC_REGISTRY, vvcTag), vvcPayload, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van contact in Firestore:', err);
  }
}

export async function deleteContactFromFirestore(contactId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CONTACTS, contactId));
  } catch (err) {
    console.error('Fout bij verwijderen van contact in Firestore:', err);
  }
}

export function subscribeToContacts(
  orgId: string, 
  callback: (contacts: Contact[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    return () => {};
  }
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.CONTACTS))
    : query(collection(db, COLLECTIONS.CONTACTS), where('org_id', '==', orgId));

  return onSnapshot(q, (snapshot) => {
    const contacts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Contact));
    callback(contacts);
  }, (error) => {
    console.warn('Real-time contacts subscription fout:', error);
  });
}

// ====================================================
// COMPANIES
// ====================================================

export async function fetchCompaniesFromFirestore(orgId: string): Promise<Company[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const isMasterView = orgId === 'all' || orgId === '*';
    const q = isMasterView
      ? query(collection(db, COLLECTIONS.COMPANIES))
      : query(collection(db, COLLECTIONS.COMPANIES), where('org_id', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Company));
  } catch (err) {
    console.error('Fout bij ophalen van bedrijven uit Firestore:', err);
    return [];
  }
}

export async function saveCompanyToFirestore(company: Company, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.COMPANIES, company.id);
    await setDoc(docRef, {
      ...company,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van bedrijf in Firestore:', err);
  }
}

export async function deleteCompanyFromFirestore(companyId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
  } catch (err) {
    console.error('Fout bij verwijderen van bedrijf in Firestore:', err);
  }
}

export function subscribeToCompanies(
  orgId: string, 
  callback: (companies: Company[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    return () => {};
  }
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.COMPANIES))
    : query(collection(db, COLLECTIONS.COMPANIES), where('org_id', '==', orgId));

  return onSnapshot(q, (snapshot) => {
    const companies = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Company));
    callback(companies);
  }, (error) => {
    console.warn('Real-time companies subscription fout:', error);
  });
}

// ====================================================
// DEALS
// ====================================================

export async function fetchDealsFromFirestore(orgId: string): Promise<Deal[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.DEALS), 
      where('org_id', '==', orgId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Deal));
  } catch (err) {
    console.error('Fout bij ophalen van deals uit Firestore:', err);
    return [];
  }
}

export async function saveDealToFirestore(deal: Deal, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.DEALS, deal.id);
    await setDoc(docRef, {
      ...deal,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van deal in Firestore:', err);
  }
}

export async function deleteDealFromFirestore(dealId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.DEALS, dealId));
  } catch (err) {
    console.error('Fout bij verwijderen van deal in Firestore:', err);
  }
}

export function subscribeToDeals(
  orgId: string, 
  callback: (deals: Deal[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    return () => {};
  }
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.DEALS))
    : query(collection(db, COLLECTIONS.DEALS), where('org_id', '==', orgId));

  return onSnapshot(q, (snapshot) => {
    const deals = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Deal));
    callback(deals);
  }, (error) => {
    console.warn('Real-time deals subscription fout:', error);
  });
}

// ====================================================
// ACTIVITIES
// ====================================================

export async function fetchActivitiesFromFirestore(orgId: string): Promise<Activity[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const isMasterView = orgId === 'all' || orgId === '*';
    const q = isMasterView
      ? query(collection(db, COLLECTIONS.ACTIVITIES))
      : query(collection(db, COLLECTIONS.ACTIVITIES), where('org_id', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Activity));
  } catch (err) {
    console.error('Fout bij ophalen van activiteiten uit Firestore:', err);
    return [];
  }
}

export async function saveActivityToFirestore(activity: Activity, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.ACTIVITIES, activity.id);
    await setDoc(docRef, {
      ...activity,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van activiteit in Firestore:', err);
  }
}

export async function deleteActivityFromFirestore(activityId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ACTIVITIES, activityId));
  } catch (err) {
    console.error('Fout bij verwijderen van activiteit in Firestore:', err);
  }
}

export function subscribeToActivities(
  orgId: string, 
  callback: (activities: Activity[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    return () => {};
  }
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.ACTIVITIES))
    : query(collection(db, COLLECTIONS.ACTIVITIES), where('org_id', '==', orgId));

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Activity));
    callback(activities);
  }, (error) => {
    console.warn('Real-time activities subscription fout:', error);
  });
}

// ====================================================
// CANDIDATES (RECRUITMENT)
// ====================================================

export async function saveCandidateToFirestore(candidate: Candidate, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const vvcTag =
      candidate.vvc_tag ||
      `vvc-cand-${candidate.id.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

    const docRef = doc(db, COLLECTIONS.CANDIDATES, candidate.id);
    await setDoc(docRef, {
      ...candidate,
      vvc_tag: vvcTag,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });

    // Registreer kandidaat-aanmelding direct in vvc_sync_codes en crm_vvc_registry zodat VVC de gegevens via API kan ophalen
    const vvcPayload = {
      vvc_tag: vvcTag,
      registration_type: 'candidate',
      entity_id: candidate.id,
      candidate_id: candidate.id,
      first_name: candidate.first_name || '',
      last_name: candidate.last_name || '',
      full_name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
      email: candidate.email || '',
      phone: candidate.phone || '',
      company: candidate.company_name || 'Kandidaat Aanmelding',
      status: candidate.status || 'new',
      source: candidate.source || 'Recruitment',
      location: candidate.location || '',
      skills: candidate.skills || [],
      experience_years: candidate.experience_years || 0,
      org_id: orgId,
      created_at: candidate.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.VVC_SYNC_CODES, vvcTag), vvcPayload, { merge: true });
    await setDoc(doc(db, COLLECTIONS.VVC_REGISTRY, vvcTag), vvcPayload, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van kandidaat:', err);
  }
}

export async function deleteCandidateFromFirestore(candidateId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId));
  } catch (err) {
    console.error('Fout bij verwijderen van kandidaat:', err);
  }
}

export function subscribeToCandidates(
  orgId: string, 
  callback: (candidates: Candidate[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.CANDIDATES))
    : query(collection(db, COLLECTIONS.CANDIDATES), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
    callback(items);
  }, (err) => console.warn('Real-time candidates subscription fout:', err));
}

// ====================================================
// JOBS (RECRUITMENT)
// ====================================================

export async function saveJobToFirestore(job: Job, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.JOBS, job.id);
    await setDoc(docRef, {
      ...job,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van vacature:', err);
  }
}

export async function deleteJobFromFirestore(jobId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.JOBS, jobId));
  } catch (err) {
    console.error('Fout bij verwijderen van vacature:', err);
  }
}

export function subscribeToJobs(
  orgId: string,
  callback: (jobs: Job[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.JOBS))
    : query(collection(db, COLLECTIONS.JOBS), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
    callback(items);
  }, (err) => console.warn('Real-time jobs subscription fout:', err));
}

// ====================================================
// CAMPAIGNS (CONTACT CENTER)
// ====================================================

export async function saveCampaignToFirestore(campaign: Campaign, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.CAMPAIGNS, campaign.id);
    await setDoc(docRef, {
      ...campaign,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van campagne:', err);
  }
}

export function subscribeToCampaigns(
  orgId: string,
  callback: (campaigns: Campaign[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.CAMPAIGNS))
    : query(collection(db, COLLECTIONS.CAMPAIGNS), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
    callback(items);
  }, (err) => console.warn('Real-time campaigns subscription fout:', err));
}

// ====================================================
// CALLS (CONTACT CENTER)
// ====================================================

export async function saveCallToFirestore(call: Call, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.CALLS, call.id);
    await setDoc(docRef, {
      ...call,
      org_id: orgId,
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van oproep:', err);
  }
}

export function subscribeToCalls(
  orgId: string,
  callback: (calls: Call[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.CALLS))
    : query(collection(db, COLLECTIONS.CALLS), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Call));
    callback(items);
  }, (err) => console.warn('Real-time calls subscription fout:', err));
}

// ====================================================
// QUOTES & PRODUCTS (SALES)
// ====================================================

export async function saveQuoteToFirestore(quote: Quote, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.QUOTES, quote.id);
    await setDoc(docRef, {
      ...quote,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van offerte:', err);
  }
}

export async function deleteQuoteFromFirestore(quoteId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTES, quoteId));
  } catch (err) {
    console.error('Fout bij verwijderen van offerte:', err);
  }
}

export function subscribeToQuotes(
  orgId: string,
  callback: (quotes: Quote[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.QUOTES))
    : query(collection(db, COLLECTIONS.QUOTES), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));
    callback(items);
  }, (err) => console.warn('Real-time quotes subscription fout:', err));
}

export async function saveProductToFirestore(product: Product, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(docRef, {
      ...product,
      org_id: orgId,
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van product:', err);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (err) {
    console.error('Fout bij verwijderen van product:', err);
  }
}

export function subscribeToProducts(
  orgId: string,
  callback: (products: Product[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.PRODUCTS))
    : query(collection(db, COLLECTIONS.PRODUCTS), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    callback(items);
  }, (err) => console.warn('Real-time products subscription fout:', err));
}

// ====================================================
// PURGE MOCK & DEMO DATA
// ====================================================

export async function purgeDemoAndMockDataFromFirestore(orgId: string): Promise<number> {
  // Always clear legacy localStorage mock keys
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('crmos-crm-storage');
    window.localStorage.removeItem('crmos-recruitment-storage');
    window.localStorage.removeItem('crmos-contact-center-storage');
    window.localStorage.removeItem('crmos-enhanced-storage');
  }

  if (!isFirebaseConfigured()) return 0;

  let deletedCount = 0;
  const mockIds = new Set(['1', '2', '3', '4', '5']);

  try {
    for (const colName of Object.values(COLLECTIONS)) {
      const q = query(collection(db, colName), where('org_id', '==', orgId));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const id = docSnap.id;
        if (mockIds.has(id) || id.startsWith('demo_')) {
          await deleteDoc(doc(db, colName, id));
          deletedCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Fout bij opschonen van mock data uit Firestore:', err);
  }

  return deletedCount;
}

// ====================================================
// DEMO DATA SEEDER (3 DISCIPLINES)
// ====================================================

export async function seedDemoDataToFirestore(orgId: string): Promise<{ success: boolean; count: number }> {
  if (!isFirebaseConfigured()) {
    return { success: false, count: 0 };
  }

  try {
    let count = 0;

    // 1. Sample Contacts (D2D & Inbound Leads with unique VVC communication tags)
    const demoContacts: Contact[] = [
      {
        id: `demo_c1_${Date.now()}`,
        first_name: 'Daan',
        last_name: 'van Vliet',
        email: 'd.vanvliet@amsterdam-holding.nl',
        phone: '+31 20 894 1201',
        mobile: '+31 6 12345678',
        company: 'Amsterdam Holding B.V.',
        title: 'Commercieel Directeur',
        industry: 'Zakelijke Dienstverlening',
        status: 'customer',
        source: 'Deur-tot-deur Buitendienst',
        assigned_to: 'agent_jamal',
        tags: ['vvc-demo-c1', 'd2d-gesloten', 'contract-getekend', 'amsterdam-1012'],
        address: { street: 'Singel 240', city: 'Amsterdam', postal_code: '1012 DH', country: 'Nederland' },
        custom_fields: { rayon: 'Amsterdam Centrum', deal_cycle: '3 dagen' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `demo_c2_${Date.now()}`,
        first_name: 'Sanne',
        last_name: 'de Boer',
        email: 'sanne@rotterdamlogistics.nl',
        phone: '+31 10 456 7890',
        company: 'Rotterdam Logistics Group',
        title: 'Operations Manager',
        industry: 'Logistiek',
        status: 'prospect',
        source: 'Callcenter Campagne',
        assigned_to: 'agent_maria',
        tags: ['vvc-demo-c2', 'terugbellen', 'warm-lead'],
        address: { street: 'Maasboulevard 100', city: 'Rotterdam', postal_code: '3063 NS', country: 'Nederland' },
        custom_fields: { rayon: 'Rotterdam Haven', beller: 'Maria Garcia' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const c of demoContacts) {
      await saveContactToFirestore(c, orgId);
      count++;
    }

    // 2. Sample Companies
    const demoCompanies: Company[] = [
      {
        id: `demo_co1_${Date.now()}`,
        name: 'Amsterdam Holding B.V.',
        domain: 'amsterdam-holding.nl',
        industry: 'Zakelijke Dienstverlening',
        size: '50-100',
        revenue: '€5.000.000',
        address: { street: 'Singel 240', city: 'Amsterdam', postal_code: '1012 DH', country: 'Nederland' },
        phone: '+31 20 894 1200',
        website: 'https://amsterdam-holding.nl',
        contacts_count: 1,
        deals_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const co of demoCompanies) {
      await saveCompanyToFirestore(co, orgId);
      count++;
    }

    // 3. Sample Deals
    const demoDeals: Deal[] = [
      {
        id: `demo_d1_${Date.now()}`,
        name: 'Amsterdam Holding - Field Sales Contract',
        company_id: demoCompanies[0].id,
        company_name: 'Amsterdam Holding B.V.',
        contact_id: demoContacts[0].id,
        contact_name: 'Daan van Vliet',
        value: 48000,
        currency: 'EUR',
        stage: 'won',
        pipeline_id: 'default',
        probability: 100,
        source: 'Field Sales Deur-tot-Deur',
        assigned_to: 'agent_jamal',
        assigned_name: 'Jamal Drenthe',
        tags: ['d2d-gesloten', 'jaarcontract'],
        notes: 'Verkocht aan de deur op Singel 240. Digitale handtekening direct verwerkt via iPad flow.',
        activities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `demo_d2_${Date.now()}`,
        name: 'Rotterdam Logistics - Callcenter Pilot',
        company_id: 'demo_co2',
        company_name: 'Rotterdam Logistics Group',
        contact_id: demoContacts[1].id,
        contact_name: 'Sanne de Boer',
        value: 18500,
        currency: 'EUR',
        stage: 'negotiation',
        pipeline_id: 'default',
        probability: 75,
        source: 'Outbound Callcenter',
        assigned_to: 'agent_maria',
        assigned_name: 'Maria Garcia',
        tags: ['pitchflow-afgerond'],
        notes: 'Positief gesprek via belscript Stap 3. Offerte verzonden via 1-click generator.',
        activities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const d of demoDeals) {
      await saveDealToFirestore(d, orgId);
      count++;
    }

    // 4. Sample Recruitment Candidates
    const demoCandidates: Candidate[] = [
      {
        id: `demo_cand1_${Date.now()}`,
        first_name: 'Thomas',
        last_name: 'Bakker',
        email: 'thomas.bakker@salespro.nl',
        phone: '+31 6 87654321',
        status: 'offer',
        source: 'Indeed Direct',
        skills: ['Deur-tot-deur sales', 'Koude acquisitie', 'Onderhandelen', 'Rijbewijs B'],
        experience_years: 3,
        expected_salary: 3200,
        location: 'Utrecht',
        notes: 'Topkandidaat voor D2D rayon Utrecht & Amsterdam. Kan volgende week starten met buitendienst verkoop.',
        assigned_to: 'recruiter_laura',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const cand of demoCandidates) {
      await saveCandidateToFirestore(cand, orgId);
      count++;
    }

    // 5. Sample Contact Center Campaigns
    const demoCampaign: Campaign = {
      id: `demo_camp1_${Date.now()}`,
      name: 'Q4 Zakelijk B2B Glasvezel & Software',
      type: 'outbound',
      status: 'active',
      description: 'Grootschalige telemarketing actie voor binnendienst bellers met dynamische pitch flow.',
      script: 'Goedemiddag [Klant], met [Agent] van CRMos...',
      pitch_flow_id: 'flow_q4',
      target_contacts: 1000,
      completed_contacts: 420,
      conversion_rate: 14.2,
      assigned_agents: ['agent_jamal', 'agent_maria'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveCampaignToFirestore(demoCampaign, orgId);
    count++;

    return { success: true, count };
  } catch (err) {
    console.error('Fout bij seeden van demo data:', err);
    return { success: false, count: 0 };
  }
}

// ====================================================
// TERRITORIES (RAYONS)
// ====================================================

export async function saveTerritoryToFirestore(territory: Territory, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.TERRITORIES, territory.id);
    await setDoc(docRef, {
      ...territory,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van rayon/territory:', err);
  }
}

export async function deleteTerritoryFromFirestore(territoryId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TERRITORIES, territoryId));
  } catch (err) {
    console.error('Fout bij verwijderen van rayon/territory:', err);
  }
}

export function subscribeToTerritories(
  orgId: string,
  callback: (territories: Territory[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.TERRITORIES))
    : query(collection(db, COLLECTIONS.TERRITORIES), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Territory));
    callback(items);
  }, (err) => console.warn('Real-time territories subscription fout:', err));
}

// ====================================================
// D2D ADDRESS PINS (FIELD SALES)
// ====================================================

export async function saveD2DPinToFirestore(pin: D2DAddressPin, orgId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.D2D_PINS, pin.id);
    await setDoc(docRef, {
      ...pin,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van D2D adres-pin:', err);
  }
}

export async function deleteD2DPinFromFirestore(pinId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.D2D_PINS, pinId));
  } catch (err) {
    console.error('Fout bij verwijderen van D2D adres-pin:', err);
  }
}

export function subscribeToD2DPins(
  orgId: string,
  callback: (pins: D2DAddressPin[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const isMasterView = orgId === 'all' || orgId === '*';
  const q = isMasterView
    ? query(collection(db, COLLECTIONS.D2D_PINS))
    : query(collection(db, COLLECTIONS.D2D_PINS), where('org_id', '==', orgId));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as D2DAddressPin));
    callback(items);
  }, (err) => console.warn('Real-time D2D pins subscription fout:', err));
}

