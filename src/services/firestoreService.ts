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
import type { Contact, Company, Deal, Activity } from '@/types';

// Collection Names
const COLLECTIONS = {
  CONTACTS: 'crm_contacts',
  COMPANIES: 'crm_companies',
  DEALS: 'crm_deals',
  ACTIVITIES: 'crm_activities',
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
    const docRef = doc(db, COLLECTIONS.CONTACTS, contact.id);
    await setDoc(docRef, {
      ...contact,
      org_id: orgId,
      updated_at: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
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
  const q = query(
    collection(db, COLLECTIONS.CONTACTS), 
    where('org_id', '==', orgId)
  );
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
    const q = query(
      collection(db, COLLECTIONS.COMPANIES), 
      where('org_id', '==', orgId)
    );
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
  const q = query(
    collection(db, COLLECTIONS.COMPANIES), 
    where('org_id', '==', orgId)
  );
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
  const q = query(
    collection(db, COLLECTIONS.DEALS), 
    where('org_id', '==', orgId)
  );
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
    const q = query(
      collection(db, COLLECTIONS.ACTIVITIES), 
      where('org_id', '==', orgId)
    );
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
  const q = query(
    collection(db, COLLECTIONS.ACTIVITIES), 
    where('org_id', '==', orgId)
  );
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
