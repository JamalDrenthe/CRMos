import type { Contact, Company, Candidate, CRMTeam, TeamStatus } from '@/types';
import { CORE_PARTNER_OPTIONS, formatCompanyTag } from '@/lib/companyAccess';
import { ensureContactVvcTag, getVvcTag } from '@/services/vvcTagService';

// ============================================================================
// 1. STANDAARD TEAMS & DE 7 KERN-RECRUITS VAN JAMAL DRENTHE
// ============================================================================

export const DEFAULT_CRM_TEAMS: CRMTeam[] = [
  {
    id: 'team_jamal_drenthe',
    name: 'Team Jamal Drenthe',
    leader_id: 'hs_cont_596065256635',
    leader_name: 'Jamal Drenthe',
    referred_by_name: 'Jamal Drenthe (Founder)',
    status: 'active',
    member_ids: [
      'hs_cont_596065256635',
      'hs_cont_596107111629',
      'hs_cont_596134466772',
      'hs_cont_596054064370',
      'hs_cont_596206040256',
      'cont_core_boas_salesmates',
      'hs_cont_596116383965',
      'hs_cont_596209818863',
    ],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Hoofdteam onder directe leiding van Jamal Drenthe. Alle direct door Jamal aangeleverde leden mogen een eigen team starten.',
    created_at: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 'team_reyhan',
    name: 'Team Reyhan',
    leader_id: 'hs_cont_596107111629',
    leader_name: 'Reyhan Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596107111629'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Reyhan (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_julius',
    name: 'Team Julius',
    leader_id: 'hs_cont_596134466772',
    leader_name: 'Julius Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596134466772'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Julius (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_jayden',
    name: 'Team Jayden',
    leader_id: 'hs_cont_596054064370',
    leader_name: 'Jayden Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596054064370'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Jayden (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_deniz',
    name: 'Team Deniz',
    leader_id: 'hs_cont_596206040256',
    leader_name: 'Deniz Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596206040256'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Deniz (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_boas',
    name: 'Team Boas',
    leader_id: 'cont_core_boas_salesmates',
    leader_name: 'Boas Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['cont_core_boas_salesmates'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Boas (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_fawzan',
    name: 'Team Fawzan',
    leader_id: 'hs_cont_596116383965',
    leader_name: 'Fawzan Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596116383965'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Fawzan (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_ricardo',
    name: 'Team Ricardo',
    leader_id: 'hs_cont_596209818863',
    leader_name: 'Ricardo Salesmates',
    referred_by_name: 'Jamal Drenthe',
    status: 'active',
    member_ids: ['hs_cont_596209818863'],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Actief sales- & referralteam onder leiding van Ricardo (aangeleverd door Jamal Drenthe).',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'team_passive_network',
    name: 'Passief Referral Netwerk',
    leader_id: 'hs_cont_596065256635',
    leader_name: 'Jamal Drenthe',
    referred_by_name: 'Jamal Drenthe',
    status: 'passive',
    member_ids: [],
    company_name: 'VVC (Verdienende Vrienden Club)',
    description: 'Passief referral- en ambassadeursnetwerk voor contacten die passief leads of referrals aanleveren.',
    created_at: '2026-01-15T09:00:00.000Z',
  },
];

export interface CoreLeaderSeed {
  id: string;
  keyName: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_id: string;
  team_name: string;
  title: string;
  company: string;
  company_tags: string[];
  tags: string[];
  notes: string;
}

export const CORE_JAMAL_REFERRAL_LEADERS: CoreLeaderSeed[] = [
  {
    id: 'hs_cont_596107111629',
    keyName: 'reyhan',
    first_name: 'Reyhan',
    last_name: 'Salesmates',
    email: 'reyhan@verdienendevrienden.club',
    phone: '+31685569180',
    team_id: 'team_reyhan',
    team_name: 'Team Reyhan',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596134466772',
    keyName: 'julius',
    first_name: 'Julius',
    last_name: 'Salesmates',
    email: 'julius@verdienendevrienden.club',
    phone: '+31639684103',
    team_id: 'team_julius',
    team_name: 'Team Julius',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596054064370',
    keyName: 'jayden',
    first_name: 'Jayden',
    last_name: 'Salesmates',
    email: 'jayden@verdienendevrienden.club',
    phone: '+31639496400',
    team_id: 'team_jayden',
    team_name: 'Team Jayden',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596206040256',
    keyName: 'deniz',
    first_name: 'Deniz',
    last_name: 'Salesmates',
    email: 'deniz@verdienendevrienden.club',
    phone: '+31684399360',
    team_id: 'team_deniz',
    team_name: 'Team Deniz',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'cont_core_boas_salesmates',
    keyName: 'boas',
    first_name: 'Boas',
    last_name: 'Salesmates',
    email: 'boas@verdienendevrienden.club',
    phone: '+31624891042',
    team_id: 'team_boas',
    team_name: 'Team Boas',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596116383965',
    keyName: 'fawzan',
    first_name: 'Fawzan',
    last_name: 'Salesmates',
    email: 'fawzan@verdienendevrienden.club',
    phone: '+31683855525',
    team_id: 'team_fawzan',
    team_name: 'Team Fawzan',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596209818863',
    keyName: 'ricardo',
    first_name: 'Ricardo',
    last_name: 'Salesmates',
    email: 'ricardo@verdienendevrienden.club',
    phone: '+31634035033',
    team_id: 'team_ricardo',
    team_name: 'Team Ricardo',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
];

export function isReferredByJamal(referredByName?: string, contact?: Partial<Contact>): boolean {
  if (contact?.team_request_status === 'approved') return true;
  if (contact?.can_start_team === true) return true;
  const ref = (referredByName || contact?.referred_by_name || '').trim().toLowerCase();
  if (ref.includes('jamal')) return true;
  const fullName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.toLowerCase();
  if (fullName.includes('jamal drenthe')) return true;
  return false;
}

/**
 * Normalizes a HubSpot contact ID so multi-org duplicates
 * (e.g. hs_cont_crmosone-dev_596107111629, hs_cont_org1_596107111629)
 * collapse into a single canonical contact (hs_cont_596107111629).
 */
export function getCanonicalContactKey(contact: Contact): string {
  const rawId = contact.id || '';
  const hsMatch = rawId.match(/^hs_cont_(?:[a-zA-Z0-9_-]+_)?(\d+)$/);
  if (hsMatch) {
    return `hs_cont_${hsMatch[1]}`;
  }
  const hsIdField = contact.custom_fields?.hubspot_id;
  if (hsIdField) {
    return `hs_cont_${String(hsIdField)}`;
  }
  return rawId;
}

/**
 * Deduplicates contacts and ensures all 7 core recruits (Reyhan, Julius, Jayden,
 * Deniz, Boas, Fawzan, Ricardo) + Jamal Drenthe are present and every contact
 * in the CRM is assigned to a referral/recruit team with active/passive status.
 */
export function deduplicateAndEnrichContactsWithTeams(
  rawContacts: Contact[],
  existingTeams: CRMTeam[] = DEFAULT_CRM_TEAMS
): {
  contacts: Contact[];
  teams: CRMTeam[];
  addedOrUpdatedCoreContacts: Contact[];
} {
  // 1. Merge default teams with existing teams
  const teamsMap = new Map<string, CRMTeam>();
  for (const dt of DEFAULT_CRM_TEAMS) {
    teamsMap.set(dt.id, { ...dt });
  }
  for (const et of existingTeams) {
    const prev = teamsMap.get(et.id);
    teamsMap.set(et.id, prev ? { ...prev, ...et } : et);
  }

  // 2. Deduplicate contacts by canonical key (preferring default_org / hs_cont_<digits> and richest fields)
  const dedupedMap = new Map<string, Contact>();
  for (const c of rawContacts) {
    if (!c) continue;
    const key = getCanonicalContactKey(c);
    const existing = dedupedMap.get(key);
    if (!existing) {
      // Normalize ID to canonical if it was an org-prefixed duplicate
      const normalizedId = key.startsWith('hs_cont_') ? key : c.id;
      dedupedMap.set(key, { ...c, id: normalizedId });
    } else {
      // Merge tags, company_tags, and prefer non-empty fields
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(c.tags || [])]));
      const mergedCompanyTags = Array.from(new Set([...(existing.company_tags || []), ...(c.company_tags || [])]));
      const preferNew = c.id === key || (!existing.team_id && Boolean(c.team_id));
      const base = preferNew ? { ...existing, ...c, id: key.startsWith('hs_cont_') ? key : existing.id } : { ...c, ...existing };
      dedupedMap.set(key, {
        ...base,
        first_name: existing.first_name || c.first_name || '',
        last_name: existing.last_name || c.last_name || '',
        email: existing.email || c.email || '',
        phone: existing.phone || c.phone || '',
        company: existing.company || c.company || '',
        notes: existing.notes || c.notes,
        team_id: existing.team_id || c.team_id,
        team_name: existing.team_name || c.team_name,
        team_status: existing.team_status || c.team_status,
        referred_by_name: existing.referred_by_name || c.referred_by_name,
        tags: mergedTags,
        company_tags: mergedCompanyTags,
      });
    }
  }

  const existingVvcTags = new Set<string>();
  dedupedMap.forEach((c) => {
    const vt = getVvcTag(c);
    if (vt) existingVvcTags.add(vt.toLowerCase());
  });

  const addedOrUpdatedCoreContacts: Contact[] = [];
  const now = new Date().toISOString();

  // 3. Ensure the 7 core leaders (Reyhan, Julius, Jayden, Deniz, Boas, Fawzan, Ricardo) exist and are enriched
  for (const seed of CORE_JAMAL_REFERRAL_LEADERS) {
    let matchedKey: string | null = null;
    if (dedupedMap.has(seed.id)) {
      matchedKey = seed.id;
    } else {
      for (const [k, contact] of dedupedMap.entries()) {
        const fullNameLower = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        if (
          fullNameLower.startsWith(seed.keyName) ||
          fullNameLower.includes(`${seed.keyName} salesmates`)
        ) {
          matchedKey = k;
          break;
        }
      }
    }

    if (matchedKey) {
      const current = dedupedMap.get(matchedKey)!;
      // Split "Reyhan Salesmates" cleanly if last_name is empty
      let firstName = current.first_name || seed.first_name;
      let lastName = current.last_name || seed.last_name;
      if (firstName.toLowerCase().endsWith(' salesmates') && !current.last_name) {
        firstName = seed.first_name;
        lastName = 'Salesmates';
      }

      const enriched = ensureContactVvcTag(
        {
          ...current,
          first_name: firstName,
          last_name: lastName,
          email: current.email || seed.email,
          phone: current.phone || seed.phone,
          company: current.company || seed.company,
          title: current.title || seed.title,
          status: current.status === 'lead' ? 'partner' : current.status || 'partner',
          team_id: current.team_id || seed.team_id,
          team_name: current.team_name || seed.team_name,
          team_status: current.team_status || 'active',
          team_role: current.team_role || 'leader',
          referred_by_name: current.referred_by_name || 'Jamal Drenthe',
          can_start_team: true,
          own_team_id: seed.team_id,
          own_team_name: seed.team_name,
          notes: current.notes || seed.notes,
          company_tags: Array.from(new Set([...(current.company_tags || []), ...seed.company_tags])),
          tags: Array.from(new Set([...(current.tags || []), ...seed.tags])),
          allowed_companies: current.allowed_companies?.length ? current.allowed_companies : [...CORE_PARTNER_OPTIONS],
        },
        existingVvcTags
      );
      dedupedMap.set(matchedKey, enriched);
    } else {
      // Create missing core contact (e.g. Boas Salesmates)
      const created = ensureContactVvcTag(
        {
          id: seed.id,
          org_id: 'default_org',
          company_name: 'VVC (Verdienende Vrienden Club)',
          allowed_companies: [...CORE_PARTNER_OPTIONS],
          first_name: seed.first_name,
          last_name: seed.last_name,
          email: seed.email,
          phone: seed.phone,
          company: seed.company,
          company_id: 'comp_core_vvc',
          title: seed.title,
          status: 'partner',
          contact_type: 'partner',
          score: 92,
          source: 'Direct Referral - Jamal Drenthe',
          team_id: seed.team_id,
          team_name: seed.team_name,
          team_status: 'active',
          team_role: 'leader',
          referred_by_name: 'Jamal Drenthe',
          can_start_team: true,
          own_team_id: seed.team_id,
          own_team_name: seed.team_name,
          notes: seed.notes,
          company_tags: [...seed.company_tags],
          tags: [...seed.tags],
          custom_fields: {
            referred_by: 'Jamal Drenthe',
            can_start_team: true,
            team_leader: true,
          },
          created_at: now,
          updated_at: now,
        },
        existingVvcTags
      );
      dedupedMap.set(seed.id, created);
      addedOrUpdatedCoreContacts.push(created);
    }
  }

  // 4. Ensure every contact in the CRM is assigned to a team and has referral/team_status fields populated
  const finalContacts: Contact[] = [];
  let assignIndex = 0;
  const activeLeaderTeams = [
    { id: 'team_jamal_drenthe', name: 'Team Jamal Drenthe', leader: 'Jamal Drenthe' },
    { id: 'team_reyhan', name: 'Team Reyhan', leader: 'Reyhan Salesmates' },
    { id: 'team_julius', name: 'Team Julius', leader: 'Julius Salesmates' },
    { id: 'team_jayden', name: 'Team Jayden', leader: 'Jayden Salesmates' },
    { id: 'team_deniz', name: 'Team Deniz', leader: 'Deniz Salesmates' },
    { id: 'team_boas', name: 'Team Boas', leader: 'Boas Salesmates' },
    { id: 'team_fawzan', name: 'Team Fawzan', leader: 'Fawzan Salesmates' },
    { id: 'team_ricardo', name: 'Team Ricardo', leader: 'Ricardo Salesmates' },
  ];

  for (const contact of dedupedMap.values()) {
    const fullNameLower = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const isSalesmate = fullNameLower.includes('salesmate');
    const isJamalSelf = fullNameLower.includes('jamal drenthe');

    // Clean up "Name Salesmates" if last_name is empty
    let firstName = contact.first_name || 'Contact';
    let lastName = contact.last_name || '';
    if (!lastName && firstName.includes(' ')) {
      const parts = firstName.trim().split(/\s+/);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }

    let referredBy = contact.referred_by_name;
    let teamId = contact.team_id;
    let teamName = contact.team_name;
    let teamStatus: TeamStatus = contact.team_status || (contact.status === 'churned' ? 'passive' : 'active');
    let teamRole = contact.team_role || 'member';

    if (isJamalSelf) {
      referredBy = 'Jamal Drenthe (Founder)';
      teamId = 'team_jamal_drenthe';
      teamName = 'Team Jamal Drenthe';
      teamStatus = 'active';
      teamRole = 'leader';
    } else if (isSalesmate && !referredBy) {
      referredBy = 'Jamal Drenthe';
      teamId = teamId || 'team_jamal_drenthe';
      teamName = teamName || 'Team Jamal Drenthe';
      teamStatus = contact.team_status || 'active';
    } else if (!teamId || !teamName) {
      const chosen = activeLeaderTeams[assignIndex % activeLeaderTeams.length];
      assignIndex++;
      teamId = chosen.id;
      teamName = chosen.name;
      referredBy = referredBy || chosen.leader;
    }

    const canStart = isReferredByJamal(referredBy, contact);
    const statusTag = teamStatus === 'active' ? 'Actief Team' : 'Passief Team';
    const currentTags = Array.isArray(contact.tags) ? contact.tags : [];
    const cleanedTags = currentTags.filter((t) => t !== 'Actief Team' && t !== 'Passief Team');
    const nextTags = Array.from(new Set([...cleanedTags, statusTag]));

    const companyTag = contact.company ? formatCompanyTag(contact.company) : '#vvc';
    const nextCompanyTags = Array.from(
      new Set([...(contact.company_tags || []), ...(companyTag && companyTag !== '#' ? [companyTag] : [])])
    );

    const enrichedContact: Contact = {
      ...contact,
      first_name: firstName,
      last_name: lastName,
      team_id: teamId,
      team_name: teamName,
      team_status: teamStatus,
      team_role: teamRole,
      referred_by_name: referredBy || 'Jamal Drenthe',
      can_start_team: canStart,
      team_request_status: contact.team_request_status || (canStart ? 'approved' : 'none'),
      company_tags: nextCompanyTags,
      tags: nextTags,
    };

    finalContacts.push(enrichedContact);

    // Register member on team
    if (teamId && teamsMap.has(teamId)) {
      const t = teamsMap.get(teamId)!;
      if (!t.member_ids.includes(enrichedContact.id)) {
        t.member_ids.push(enrichedContact.id);
      }
    }
  }

  // Sort so the 7 core leaders & Jamal Drenthe & recently updated contacts are easy to spot
  const coreIds = new Set([
    'hs_cont_596065256635',
    ...CORE_JAMAL_REFERRAL_LEADERS.map((s) => s.id),
  ]);
  finalContacts.sort((a, b) => {
    const aCore = coreIds.has(a.id) ? 1 : 0;
    const bCore = coreIds.has(b.id) ? 1 : 0;
    if (aCore !== bCore) return bCore - aCore;
    return 0;
  });

  return {
    contacts: finalContacts,
    teams: Array.from(teamsMap.values()),
    addedOrUpdatedCoreContacts,
  };
}

// ============================================================================
// 2. EXTREEM GOEDE CRM SEARCH ENGINE (NORMALISATIE, TELEFOON, TAGS, TEAMS, FUZZY)
// ============================================================================

/**
 * Strips diacritics/accents and lowercases text for fast, accent-insensitive matching.
 */
export function normalizeSearchText(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normalizes Dutch & international phone numbers into multiple searchable variants
 * so searching "0685569180", "+31685569180", "06 85569180", or "85569180" always matches!
 */
export function getPhoneSearchVariants(phone?: string | null): string[] {
  if (!phone) return [];
  const digitsAndPlus = String(phone).replace(/[\s\-().]/g, '');
  const digitsOnly = digitsAndPlus.replace(/\D/g, '');
  if (!digitsOnly) return [];

  const variants = new Set<string>([digitsOnly, digitsAndPlus.toLowerCase()]);
  if (digitsOnly.startsWith('316') && digitsOnly.length >= 11) {
    const local06 = '06' + digitsOnly.slice(3);
    variants.add(local06);
    variants.add(digitsOnly.slice(2)); // 685569180
  } else if (digitsOnly.startsWith('00316') && digitsOnly.length >= 13) {
    const local06 = '06' + digitsOnly.slice(5);
    variants.add(local06);
    variants.add('316' + digitsOnly.slice(5));
  } else if (digitsOnly.startsWith('06') && digitsOnly.length >= 10) {
    variants.add('316' + digitsOnly.slice(2));
    variants.add('+316' + digitsOnly.slice(2));
    variants.add(digitsOnly.slice(1));
  }
  return Array.from(variants);
}

/**
 * Lightweight 1-edit-distance / phonetic alias check (e.g. "boas" <-> "boaz", "reyhan" <-> "rayhan")
 */
function isCloseTokenMatch(targetWord: string, queryToken: string): boolean {
  if (!targetWord || !queryToken) return false;
  if (targetWord.includes(queryToken)) return true;

  // Common phonetic equivalents in Dutch names (s/z at end, y/i, c/k)
  const phoneticNormalize = (s: string) =>
    s
      .replace(/z$/g, 's')
      .replace(/y/g, 'i')
      .replace(/ph/g, 'f');
  if (phoneticNormalize(targetWord).includes(phoneticNormalize(queryToken))) {
    return true;
  }

  // Allow 1 character typo for tokens of length >= 4
  if (queryToken.length >= 4 && Math.abs(targetWord.length - queryToken.length) <= 1) {
    let mismatches = 0;
    let i = 0;
    let j = 0;
    while (i < targetWord.length && j < queryToken.length) {
      if (targetWord[i] === queryToken[j]) {
        i++;
        j++;
      } else {
        mismatches++;
        if (mismatches > 1) return false;
        if (targetWord.length > queryToken.length) i++;
        else if (queryToken.length > targetWord.length) j++;
        else {
          i++;
          j++;
        }
      }
    }
    mismatches += (targetWord.length - i) + (queryToken.length - j);
    return mismatches <= 1;
  }

  return false;
}

/**
 * Scores how well a Contact matches a multi-token search query.
 * Returns 0 if the contact does NOT match all tokens in the query,
 * or a positive relevance score (> 0) if it matches.
 */
export function scoreContactSearchMatch(contact: Contact, rawQuery: string): number {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return 1;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;

  const firstName = normalizeSearchText(contact.first_name);
  const lastName = normalizeSearchText(contact.last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  const nameWords = fullName.split(/\s+/).filter(Boolean);

  const email = normalizeSearchText(contact.email);
  const company = normalizeSearchText(contact.company || contact.company_name);
  const title = normalizeSearchText(contact.title);
  const vvcTag = normalizeSearchText(getVvcTag(contact) || contact.vvc_tag);
  const teamName = normalizeSearchText(contact.team_name);
  const teamStatusNL = contact.team_status === 'passive' ? 'passief passive inactief' : 'actief active';
  const teamRoleNL = contact.team_role === 'leader' ? 'teamleider leider leader captain' : 'teamlid lid member';
  const referredBy = normalizeSearchText(contact.referred_by_name);
  const canStartTeamText = contact.can_start_team ? 'mag team starten jamal recht' : 'team aanvragen aanvraag';
  const city = normalizeSearchText(contact.address?.city);
  const street = normalizeSearchText(contact.address?.street);
  const postal = normalizeSearchText(contact.address?.postal_code);
  const notes = normalizeSearchText(contact.notes);
  const source = normalizeSearchText(contact.source);
  const status = normalizeSearchText(contact.status);

  const allTags = [
    ...(contact.tags || []),
    ...(contact.company_tags || []),
    ...(contact.allowed_companies || []),
    ...(contact.member_companies || []),
  ].map((t) => normalizeSearchText(t));

  const phoneVariants = [
    ...getPhoneSearchVariants(contact.phone),
    ...getPhoneSearchVariants(contact.mobile),
  ];

  let totalScore = 0;

  // Every token in the user's query must match at least one attribute of the contact
  for (const token of tokens) {
    const cleanToken = token.replace(/^#/, '');
    const digitToken = token.replace(/[\s\-().+]/g, '');
    let tokenScore = 0;

    // 1. Exact or prefix match on first name / full name (Highest Priority)
    if (firstName === token || fullName === token) {
      tokenScore = Math.max(tokenScore, 150);
    } else if (firstName.startsWith(token) || lastName.startsWith(token) || fullName.startsWith(token)) {
      tokenScore = Math.max(tokenScore, 120);
    } else if (fullName.includes(token)) {
      tokenScore = Math.max(tokenScore, 95);
    } else if (nameWords.some((w) => isCloseTokenMatch(w, token))) {
      tokenScore = Math.max(tokenScore, 80);
    }

    // 2. Tag / Bedrijfstag / VVC Tag match
    if (vvcTag && (vvcTag === cleanToken || vvcTag.includes(cleanToken))) {
      tokenScore = Math.max(tokenScore, 110);
    }
    if (
      allTags.some(
        (t) =>
          t === token ||
          t.replace(/^#/, '') === cleanToken ||
          t.includes(token) ||
          t.replace(/^#/, '').includes(cleanToken)
      )
    ) {
      tokenScore = Math.max(tokenScore, 100);
    }

    // 3. Team name, Team status (actief/passief), Team role, or Referrer (Jamal Drenthe)
    if (teamName.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 90);
    }
    if (referredBy.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 88);
    }
    if (teamStatusNL.split(' ').some((w) => w === cleanToken || w.startsWith(cleanToken))) {
      tokenScore = Math.max(tokenScore, 85);
    }
    if (teamRoleNL.split(' ').some((w) => w === cleanToken || w.startsWith(cleanToken))) {
      tokenScore = Math.max(tokenScore, 82);
    }
    if (canStartTeamText.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 75);
    }

    // 4. Phone number match (supports 06..., +316..., partial digits)
    if (digitToken.length >= 3 && /^\d+$/.test(digitToken)) {
      if (phoneVariants.some((pv) => pv === digitToken || pv.endsWith(digitToken) || pv.includes(digitToken))) {
        tokenScore = Math.max(tokenScore, 115);
      }
    }

    // 5. Email, Company, Title, City, Address, Source, Status, Notes
    if (email.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 90);
    }
    if (company.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 85);
    }
    if (title.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 70);
    }
    if (city.includes(cleanToken) || street.includes(cleanToken) || postal.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 65);
    }
    if (status.includes(cleanToken) || source.includes(cleanToken) || notes.includes(cleanToken)) {
      tokenScore = Math.max(tokenScore, 60);
    }

    // If this token didn't match ANY field on the contact, fail the AND match
    if (tokenScore === 0) {
      return 0;
    }

    totalScore += tokenScore;
  }

  // Bonus if full query matches full name prefix
  if (fullName.startsWith(normalizedQuery)) {
    totalScore += 50;
  }

  return totalScore;
}

export function smartSearchContacts(contacts: Contact[], query: string): Contact[] {
  const trimmed = query.trim();
  if (!trimmed) return contacts;

  const scored: Array<{ contact: Contact; score: number }> = [];
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const score = scoreContactSearchMatch(c, trimmed);
    if (score > 0) {
      scored.push({ contact: c, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.contact);
}

export function smartSearchCompanies(companies: Company[], query: string): Company[] {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) return companies;
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  const scored: Array<{ company: Company; score: number }> = [];
  for (const company of companies) {
    const name = normalizeSearchText(company.name);
    const domain = normalizeSearchText(company.domain);
    const website = normalizeSearchText(company.website);
    const industry = normalizeSearchText(company.industry);
    const city = normalizeSearchText(company.address?.city);
    const street = normalizeSearchText(company.address?.street);
    const kvk = normalizeSearchText(company.kvk_number);
    const compTag = normalizeSearchText(company.company_tag || formatCompanyTag(company.name));
    const allTags = (company.company_tags || []).map((t) => normalizeSearchText(t));
    const phoneVariants = getPhoneSearchVariants(company.phone);

    let total = 0;
    let allMatched = true;
    for (const token of tokens) {
      const clean = token.replace(/^#/, '');
      let s = 0;
      if (name === clean || compTag.replace(/^#/, '') === clean) s = 140;
      else if (name.startsWith(clean) || compTag.includes(clean)) s = 110;
      else if (name.includes(clean) || allTags.some((t) => t.includes(clean))) s = 90;
      else if (domain.includes(clean) || website.includes(clean) || industry.includes(clean)) s = 75;
      else if (city.includes(clean) || street.includes(clean) || kvk.includes(clean)) s = 65;
      else if (phoneVariants.some((p) => p.includes(clean))) s = 80;

      if (s === 0) {
        allMatched = false;
        break;
      }
      total += s;
    }

    if (allMatched && total > 0) {
      scored.push({ company, score: total });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.company);
}

export function smartSearchCandidates(candidates: Candidate[], query: string): Candidate[] {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) return candidates;
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return candidates.filter((cand) => {
    const fullName = normalizeSearchText(`${cand.first_name} ${cand.last_name}`);
    const email = normalizeSearchText(cand.email);
    const vvc = normalizeSearchText(cand.vvc_tag);
    const loc = normalizeSearchText(cand.location);
    const team = normalizeSearchText(cand.team_name);
    const ref = normalizeSearchText(cand.referred_by_name);
    const skills = (cand.skills || []).map((s) => normalizeSearchText(s));
    const tags = [...(cand.tags || []), ...(cand.company_tags || [])].map((t) => normalizeSearchText(t));
    const phones = getPhoneSearchVariants(cand.phone);

    return tokens.every((tok) => {
      const clean = tok.replace(/^#/, '');
      return (
        fullName.includes(clean) ||
        email.includes(clean) ||
        vvc.includes(clean) ||
        loc.includes(clean) ||
        team.includes(clean) ||
        ref.includes(clean) ||
        skills.some((s) => s.includes(clean)) ||
        tags.some((t) => t.includes(clean)) ||
        phones.some((p) => p.includes(clean))
      );
    });
  });
}
