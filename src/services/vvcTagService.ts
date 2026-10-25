/**
 * VVC (Verdienende Vrienden Club) API Communication & Registration Tagging Service
 *
 * Genereert en beheert voor elke aanmelding (Contact, Kandidaat, Accountregistratie, Field Sale)
 * een gegarandeerd unieke VVC tag (`vvc-xxx`), en synchroniseert de aanmeldgegevens naar
 * Firestore (`vvc_sync_codes/{vvcTag}` & `crm_vvc_registry/{vvcTag}`) zodat VVC alle gegevens
 * direct via de API kan ophalen.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Contact, Candidate, User } from '@/types';

export const VVC_TAG_PREFIX = 'vvc-';

export interface VvcSyncRecord {
  vvc_tag: string;
  registration_type: 'contact' | 'candidate' | 'account' | 'field_sale';
  entity_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  role?: string;
  status?: string;
  source?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  deal_value?: number;
  order_id?: string;
  kvk_number?: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Genereert een schone, URL- en API-veilige unieke VVC identifier voor een aanmelding
 */
export function generateVvcTag(seedId?: string, existingTags?: Set<string>, typePrefix?: string): string {
  let baseId = '';
  if (seedId) {
    baseId = seedId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  if (!baseId) {
    baseId = Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
  }

  // Voorkom dubbele 'vvc-' prefix als seedId al met 'vvc-' begon
  if (baseId.startsWith(VVC_TAG_PREFIX)) {
    baseId = baseId.slice(VVC_TAG_PREFIX.length);
  }

  const prefix = typePrefix ? `${VVC_TAG_PREFIX}${typePrefix}-` : VVC_TAG_PREFIX;
  let tag = `${prefix}${baseId}`;

  // Garandeer absolute uniekheid als er al een Set met bestaande tags is
  if (existingTags && existingTags.has(tag.toLowerCase())) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    tag = `${tag}-${randomSuffix}`;
  }

  return tag;
}

/**
 * Haalt de unieke VVC communicatie tag op van een Contact, Kandidaat of Gebruiker
 */
export function getVvcTag(
  record?: { vvc_tag?: string; tags?: string[] } | null
): string | undefined {
  if (!record) return undefined;
  if (typeof record.vvc_tag === 'string' && record.vvc_tag.toLowerCase().startsWith(VVC_TAG_PREFIX)) {
    return record.vvc_tag;
  }
  if (Array.isArray(record.tags)) {
    return record.tags.find(
      (t) => typeof t === 'string' && t.toLowerCase().startsWith(VVC_TAG_PREFIX)
    );
  }
  return undefined;
}

/**
 * Controleert of een aanmelding/record voorzien is van een unieke VVC communicatie tag
 */
export function hasVvcTag(record?: { vvc_tag?: string; tags?: string[] } | null): boolean {
  return Boolean(getVvcTag(record));
}

/**
 * Garandeert dat een specifiek contact een unieke VVC communicatie tag heeft
 * (zowel in `contact.vvc_tag` als in `contact.tags`)
 */
export function ensureContactVvcTag(contact: Contact, existingTags?: Set<string>): Contact {
  const currentVvcTag = getVvcTag(contact);
  if (currentVvcTag) {
    if (existingTags) {
      existingTags.add(currentVvcTag.toLowerCase());
    }
    const tagList = Array.isArray(contact.tags) ? contact.tags : [];
    const hasInTags = tagList.some((t) => t.toLowerCase() === currentVvcTag.toLowerCase());
    if (contact.vvc_tag === currentVvcTag && hasInTags) {
      return contact;
    }
    return {
      ...contact,
      vvc_tag: currentVvcTag,
      tags: hasInTags ? tagList : [...tagList, currentVvcTag],
    };
  }

  const newTag = generateVvcTag(contact.id, existingTags);
  if (existingTags) {
    existingTags.add(newTag.toLowerCase());
  }

  const existingTagList = Array.isArray(contact.tags) ? contact.tags : [];
  return {
    ...contact,
    vvc_tag: newTag,
    tags: [...existingTagList, newTag],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Zorgt ervoor dat ALLE contacten in het systeem voorzien zijn van een unieke VVC tag
 * Detecteert duplicaten en lost deze automatisch op.
 */
export function ensureAllContactsHaveVvcTags(contacts: Contact[]): {
  updatedContacts: Contact[];
  changedCount: number;
} {
  const seenVvcTags = new Set<string>();
  let changedCount = 0;

  const updatedContacts = contacts.map((contact) => {
    const currentTag = getVvcTag(contact);

    if (currentTag && !seenVvcTags.has(currentTag.toLowerCase())) {
      seenVvcTags.add(currentTag.toLowerCase());
      const tagList = Array.isArray(contact.tags) ? contact.tags : [];
      const hasInTags = tagList.some((t) => t.toLowerCase() === currentTag.toLowerCase());
      if (contact.vvc_tag === currentTag && hasInTags) {
        return contact;
      }
      changedCount++;
      return {
        ...contact,
        vvc_tag: currentTag,
        tags: hasInTags ? tagList : [...tagList, currentTag],
      };
    }

    changedCount++;
    const newTag = generateVvcTag(contact.id, seenVvcTags);
    seenVvcTags.add(newTag.toLowerCase());

    const otherTags = Array.isArray(contact.tags)
      ? contact.tags.filter((t) => !t.toLowerCase().startsWith(VVC_TAG_PREFIX))
      : [];

    return {
      ...contact,
      vvc_tag: newTag,
      tags: [...otherTags, newTag],
      updated_at: new Date().toISOString(),
    };
  });

  return { updatedContacts, changedCount };
}

/**
 * Garandeert dat een kandidaat-aanmelding een unieke VVC tag heeft
 */
export function ensureCandidateVvcTag(candidate: Candidate, existingTags?: Set<string>): Candidate {
  const currentTag = getVvcTag(candidate);
  if (currentTag) {
    if (existingTags) {
      existingTags.add(currentTag.toLowerCase());
    }
    return candidate;
  }

  const newTag = generateVvcTag(candidate.id, existingTags, 'cand');
  if (existingTags) {
    existingTags.add(newTag.toLowerCase());
  }

  return {
    ...candidate,
    vvc_tag: newTag,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Zorgt ervoor dat ALLE kandidaten in het systeem voorzien zijn van een unieke VVC tag
 */
export function ensureAllCandidatesHaveVvcTags(candidates: Candidate[]): {
  updatedCandidates: Candidate[];
  changedCount: number;
} {
  const seenVvcTags = new Set<string>();
  let changedCount = 0;

  const updatedCandidates = candidates.map((candidate) => {
    const currentTag = getVvcTag(candidate);
    if (currentTag && !seenVvcTags.has(currentTag.toLowerCase())) {
      seenVvcTags.add(currentTag.toLowerCase());
      return candidate;
    }

    changedCount++;
    const newTag = generateVvcTag(candidate.id, seenVvcTags, 'cand');
    seenVvcTags.add(newTag.toLowerCase());

    return {
      ...candidate,
      vvc_tag: newTag,
      updated_at: new Date().toISOString(),
    };
  });

  return { updatedCandidates, changedCount };
}

/**
 * Statistieken voor VVC integratie en API tagging
 */
export function getVvcTagStats(
  contacts: Contact[],
  candidates: Candidate[] = []
): {
  total: number;
  taggedCount: number;
  percentage: number;
  contactsTotal: number;
  contactsTagged: number;
  candidatesTotal: number;
  candidatesTagged: number;
} {
  const contactsTotal = contacts.length;
  const contactsTagged = contacts.filter(hasVvcTag).length;
  const candidatesTotal = candidates.length;
  const candidatesTagged = candidates.filter(hasVvcTag).length;

  const total = contactsTotal + candidatesTotal;
  const taggedCount = contactsTagged + candidatesTagged;
  const percentage = total === 0 ? 100 : Math.round((taggedCount / total) * 100);

  return {
    total,
    taggedCount,
    percentage,
    contactsTotal,
    contactsTagged,
    candidatesTotal,
    candidatesTagged,
  };
}

/**
 * Schrijft een aanmelding (Contact, Kandidaat, Account of Field Sale) naar Firestore
 * in zowel `vvc_sync_codes/{vvcTag}` als `crm_vvc_registry/{vvcTag}` zodat VVC
 * deze gegevens direct via de API kan ophalen op basis van de unieke VVC tag.
 */
export async function syncVvcRecordToCloud(record: VvcSyncRecord): Promise<void> {
  if (!isFirebaseConfigured() || !record.vvc_tag) return;

  const cleanPayload = {
    ...record,
    updated_at: new Date().toISOString(),
    _firestore_timestamp: serverTimestamp(),
  };

  try {
    // 1. Schrijf naar vvc_sync_codes/{vvc_tag} (voor VVC sync-code API ophalen)
    const syncCodeRef = doc(db, 'vvc_sync_codes', record.vvc_tag);
    await setDoc(syncCodeRef, cleanPayload, { merge: true });

    // 2. Schrijf naar crm_vvc_registry/{vvc_tag} (voor VVC REST API registry)
    const registryRef = doc(db, 'crm_vvc_registry', record.vvc_tag);
    await setDoc(registryRef, cleanPayload, { merge: true });
  } catch (err) {
    console.warn('Kon VVC registratie niet naar Cloud synchroniseren:', err);
  }
}

/**
 * Hulpfunctie om een User account-aanmelding direct te voorzien van een unieke VVC tag
 * en te synchroniseren naar de VVC API collecties
 */
export async function registerUserAanmeldingForVvc(user: User): Promise<string> {
  const vvcTag = user.vvc_tag || generateVvcTag(user.id, undefined, 'usr');
  const nameParts = (user.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || user.name || 'Gebruiker';
  const lastName = nameParts.slice(1).join(' ') || '';

  await syncVvcRecordToCloud({
    vvc_tag: vvcTag,
    registration_type: 'account',
    entity_id: user.id,
    first_name: firstName,
    last_name: lastName,
    full_name: user.name,
    email: user.email,
    phone: user.phone || '',
    company: user.company_name || 'CRMos',
    role: user.role,
    status: 'active',
    source: 'CRMos Account Aanmelding',
    org_id: user.org_id || 'default_org',
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return vvcTag;
}

/**
 * Haalt de gegevens van een aanmelding op uit het CRM op basis van de unieke VVC tag
 * (via Firestore `vvc_sync_codes` / `crm_vvc_registry` + lokale CRM store fallback)
 */
export async function fetchAanmeldingByVvcTag(
  vvcTag: string,
  localContacts: Contact[] = [],
  localCandidates: Candidate[] = []
): Promise<VvcSyncRecord | null> {
  const cleanTag = vvcTag.trim();
  if (!cleanTag) return null;

  // 1. Probeer eerst rechtstreeks uit Firestore `vvc_sync_codes` of `crm_vvc_registry`
  if (isFirebaseConfigured()) {
    try {
      const syncSnap = await getDoc(doc(db, 'vvc_sync_codes', cleanTag));
      if (syncSnap.exists()) {
        return syncSnap.data() as VvcSyncRecord;
      }
      const regSnap = await getDoc(doc(db, 'crm_vvc_registry', cleanTag));
      if (regSnap.exists()) {
        return regSnap.data() as VvcSyncRecord;
      }
    } catch (err) {
      console.warn('Firestore VVC lookup fallback naar lokale store:', err);
    }
  }

  // 2. Fallback: zoek in lokale contacten
  const lowerTag = cleanTag.toLowerCase();
  const matchedContact = localContacts.find(
    (c) =>
      c.vvc_tag?.toLowerCase() === lowerTag ||
      c.tags?.some((t) => t.toLowerCase() === lowerTag)
  );

  if (matchedContact) {
    return {
      vvc_tag: getVvcTag(matchedContact) || cleanTag,
      registration_type: 'contact',
      entity_id: matchedContact.id,
      first_name: matchedContact.first_name,
      last_name: matchedContact.last_name,
      full_name: `${matchedContact.first_name} ${matchedContact.last_name}`.trim(),
      email: matchedContact.email,
      phone: matchedContact.phone || matchedContact.mobile || '',
      company: matchedContact.company || matchedContact.company_name || '',
      title: matchedContact.title || '',
      status: matchedContact.status,
      source: matchedContact.source,
      location: matchedContact.address?.city || '',
      org_id: matchedContact.org_id || 'default_org',
      created_at: matchedContact.created_at,
      updated_at: matchedContact.updated_at,
    };
  }

  // 3. Fallback: zoek in lokale kandidaten
  const matchedCandidate = localCandidates.find(
    (c) => c.vvc_tag?.toLowerCase() === lowerTag
  );

  if (matchedCandidate) {
    return {
      vvc_tag: matchedCandidate.vvc_tag || cleanTag,
      registration_type: 'candidate',
      entity_id: matchedCandidate.id,
      first_name: matchedCandidate.first_name,
      last_name: matchedCandidate.last_name,
      full_name: `${matchedCandidate.first_name} ${matchedCandidate.last_name}`.trim(),
      email: matchedCandidate.email,
      phone: matchedCandidate.phone || '',
      company: matchedCandidate.company_name || 'Kandidaat Aanmelding',
      status: matchedCandidate.status,
      source: matchedCandidate.source,
      location: matchedCandidate.location,
      skills: matchedCandidate.skills,
      experience_years: matchedCandidate.experience_years,
      org_id: matchedCandidate.org_id || 'default_org',
      created_at: matchedCandidate.created_at,
      updated_at: matchedCandidate.updated_at,
    };
  }

  return null;
}

/**
 * Geeft de directe REST API URL terug waarmee VVC een specifieke aanmelding kan ophalen
 */
export function getVvcFirestoreRestApiUrl(vvcTag: string): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/vvc_sync_codes/${encodeURIComponent(vvcTag.trim())}`;
}
