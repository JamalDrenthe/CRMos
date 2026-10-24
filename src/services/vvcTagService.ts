/**
 * VVC (Verdienende Vrienden Club) API Communication & Tagging Service
 * 
 * Beheert unieke tags per contactpersoon voor bidirectionele communicatie
 * tussen CRMos en het VVC Referral Netwerk via de CRMos API.
 */

import type { Contact } from '@/types';

export const VVC_TAG_PREFIX = 'vvc-';

/**
 * Genereert een schone, URL- en API-veilige unieke VVC identifier
 */
export function generateVvcTag(contactId?: string, existingTags?: Set<string>): string {
  let baseId = '';
  if (contactId) {
    // Schoon contactId op: verwijder speciale tekens, behoud alfanumeriek en koppeltekens
    baseId = contactId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  if (!baseId) {
    baseId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
  }

  let tag = `${VVC_TAG_PREFIX}${baseId}`;

  // Garandeer absolute uniekheid als er al een Set met bestaande tags is
  if (existingTags && existingTags.has(tag)) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    tag = `${tag}-${randomSuffix}`;
  }

  return tag;
}

/**
 * Haalt de unieke VVC communicatie tag op van een contactpersoon
 */
export function getVvcTag(contact: Partial<Contact>): string | undefined {
  if (!contact.tags || !Array.isArray(contact.tags)) return undefined;
  // Zoek naar tag die begint met 'vvc-'
  return contact.tags.find((t) => typeof t === 'string' && t.toLowerCase().startsWith(VVC_TAG_PREFIX));
}

/**
 * Controleert of een contactpersoon voorzien is van een unieke VVC communicatie tag
 */
export function hasVvcTag(contact: Partial<Contact>): boolean {
  return Boolean(getVvcTag(contact));
}

/**
 * Garandeert dat een specifiek contact een unieke VVC communicatie tag heeft
 */
export function ensureContactVvcTag(contact: Contact, existingTags?: Set<string>): Contact {
  const currentVvcTag = getVvcTag(contact);
  if (currentVvcTag) {
    if (existingTags) {
      existingTags.add(currentVvcTag.toLowerCase());
    }
    return contact;
  }

  const newTag = generateVvcTag(contact.id, existingTags);
  if (existingTags) {
    existingTags.add(newTag.toLowerCase());
  }

  const existingTagList = Array.isArray(contact.tags) ? contact.tags : [];
  return {
    ...contact,
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

    // Heeft al een tag en is nog niet eerder gezien
    if (currentTag && !seenVvcTags.has(currentTag.toLowerCase())) {
      seenVvcTags.add(currentTag.toLowerCase());
      return contact;
    }

    // Heeft geen tag OF had een dubbele tag: genereer een nieuwe unieke tag
    changedCount++;
    const newTag = generateVvcTag(contact.id, seenVvcTags);
    seenVvcTags.add(newTag.toLowerCase());

    const otherTags = Array.isArray(contact.tags)
      ? contact.tags.filter((t) => !t.toLowerCase().startsWith(VVC_TAG_PREFIX))
      : [];

    return {
      ...contact,
      tags: [...otherTags, newTag],
      updated_at: new Date().toISOString(),
    };
  });

  return { updatedContacts, changedCount };
}

/**
 * Statistieken voor VVC integratie en API tagging
 */
export function getVvcTagStats(contacts: Contact[]): {
  total: number;
  taggedCount: number;
  percentage: number;
} {
  const total = contacts.length;
  if (total === 0) return { total: 0, taggedCount: 0, percentage: 100 };

  const taggedCount = contacts.filter(hasVvcTag).length;
  const percentage = Math.round((taggedCount / total) * 100);

  return { total, taggedCount, percentage };
}
