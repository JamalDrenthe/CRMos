import { CRMOS_CORE_COMPANIES, isCoreEcosystemCompany, type User, type Company } from '@/types';
export { CRMOS_CORE_COMPANIES, isCoreEcosystemCompany };

/**
 * Common consumer/free webmail domains that are disallowed for CRMos business registration
 */
export const DISALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.nl',
  'outlook.com',
  'outlook.nl',
  'live.com',
  'live.nl',
  'yahoo.com',
  'yahoo.nl',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
]);

/**
 * Validates whether an email is a legitimate business email
 */
export function validateBusinessEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.includes('@')) {
    return { isValid: false, error: 'Vul een geldig e-mailadres in.' };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1]) {
    return { isValid: false, error: 'Vul een geldig e-mailadres in.' };
  }

  const domain = parts[1];

  if (DISALLOWED_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `Om toegang te krijgen tot CRMos moet je een zakelijk e-mailadres van je bedrijf gebruiken (bijv. naam@jouwbedrijf.nl). Gratis mailproviders zoals ${domain} zijn niet toegestaan.`,
    };
  }

  return { isValid: true };
}

/**
 * Helper to normalize company names for comparison
 */
export function normalizeCompanyName(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase();
}

/**
 * Standard list of all 13 core ecosystem companies in CRMos
 */
export const CORE_PARTNER_OPTIONS = [
  'VVC (Verdienende Vrienden Club)',
  'Quantum Initium',
  'Immigratiepunt',
  'Spontiva',
  'Investbotiq',
  'Boostplug',
  'CRMos',
  'Zheavenzy',
  'Logs.rent',
  'Djobba.works',
  'Trusting Work',
  'Woningvry',
  'Xabi World',
] as const;

/**
 * Formats any company name or tag into a canonical `#bedrijfstag`
 */
export function formatCompanyTag(input?: string): string {
  if (!input) return '';
  const raw = input.trim().toLowerCase().replace(/^#+/, '');
  if (raw.includes('verdienende vrienden') || raw === 'vvc') return '#vvc';
  const slug = raw
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `#${slug}` : '';
}

/**
 * Complete directory of the 13 core companies that must always be present in CRMos
 */
export const DEFAULT_ECOSYSTEM_COMPANIES: Omit<Company, 'created_at' | 'updated_at'>[] = [
  {
    id: 'comp_core_vvc',
    name: 'VVC (Verdienende Vrienden Club)',
    company_tag: '#vvc',
    company_tags: ['#vvc', '#verdienende-vrienden-club'],
    domain: 'verdienendevrienden.club',
    website: 'https://verdienendevrienden.club',
    industry: 'Sales Community & Netwerk',
    size: '50-200',
    phone: '+31 20 808 1101',
    address: { street: 'Herengracht 420', postal_code: '1017 BZ', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'VVC (Verdienende Vrienden Club)',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 14,
    deals_count: 6,
  },
  {
    id: 'comp_core_quantum_initium',
    name: 'Quantum Initium',
    company_tag: '#quantum-initium',
    company_tags: ['#quantum-initium', '#quantum'],
    domain: 'quantuminitium.com',
    website: 'https://quantuminitium.com',
    industry: 'Venture Building & AI Holding',
    size: '10-50',
    phone: '+31 20 808 1102',
    address: { street: 'Zuidas Gustav Mahlerlaan 42', postal_code: '1082 MC', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Quantum Initium',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 8,
    deals_count: 4,
  },
  {
    id: 'comp_core_immigratiepunt',
    name: 'Immigratiepunt',
    company_tag: '#immigratiepunt',
    company_tags: ['#immigratiepunt'],
    domain: 'immigratiepunt.nl',
    website: 'https://immigratiepunt.nl',
    industry: 'Juridische Dienstverlening & Immigratie',
    size: '10-50',
    phone: '+31 20 808 1103',
    address: { street: 'Weena 290', postal_code: '3012 NJ', city: 'Rotterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Immigratiepunt',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 5,
    deals_count: 3,
  },
  {
    id: 'comp_core_spontiva',
    name: 'Spontiva',
    company_tag: '#spontiva',
    company_tags: ['#spontiva'],
    domain: 'spontiva.com',
    website: 'https://spontiva.com',
    industry: 'Commerciële Groei & Outsourcing',
    size: '10-50',
    phone: '+31 20 808 1104',
    address: { street: 'Keizersgracht 241', postal_code: '1016 EA', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Spontiva',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 6,
    deals_count: 3,
  },
  {
    id: 'comp_core_investbotiq',
    name: 'Investbotiq',
    company_tag: '#investbotiq',
    company_tags: ['#investbotiq'],
    domain: 'investbotiq.com',
    website: 'https://investbotiq.com',
    industry: 'Fintech & Automated Investing',
    size: '10-50',
    phone: '+31 20 808 1105',
    address: { street: 'Strawinskylaan 3051', postal_code: '1077 ZX', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Investbotiq',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 7,
    deals_count: 4,
  },
  {
    id: 'comp_core_boostplug',
    name: 'Boostplug',
    company_tag: '#boostplug',
    company_tags: ['#boostplug'],
    domain: 'boostplug.one',
    website: 'https://boostplug.one',
    industry: 'Growth Marketing & Performance',
    size: '10-50',
    phone: '+31 20 808 1106',
    address: { street: 'Singel 542', postal_code: '1017 AZ', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Boostplug',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 9,
    deals_count: 5,
  },
  {
    id: 'comp_core_crmos',
    name: 'CRMos',
    company_tag: '#crmos',
    company_tags: ['#crmos', '#crmos.one'],
    domain: 'crmos.one',
    website: 'https://crmos.one',
    industry: 'SaaS CRM, Field Sales & Recruitment',
    size: '10-50',
    phone: '+31 20 808 1107',
    address: { street: 'Prinsengracht 769', postal_code: '1017 JZ', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'CRMos',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 18,
    deals_count: 9,
  },
  {
    id: 'comp_core_zheavenzy',
    name: 'Zheavenzy',
    company_tag: '#zheavenzy',
    company_tags: ['#zheavenzy'],
    domain: 'zheavenzy.com',
    website: 'https://zheavenzy.com',
    industry: 'E-Commerce & Lifestyle Brands',
    size: '1-10',
    phone: '+31 20 808 1108',
    address: { street: 'Kalverstraat 92', postal_code: '1012 PH', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Zheavenzy',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 4,
    deals_count: 2,
  },
  {
    id: 'comp_core_logs_rent',
    name: 'Logs.rent',
    company_tag: '#logs.rent',
    company_tags: ['#logs.rent', '#logs-rent'],
    domain: 'logs.rent',
    website: 'https://logs.rent',
    industry: 'Logistiek, Verhuur & Materieel',
    size: '10-50',
    phone: '+31 20 808 1109',
    address: { street: 'Westpoortweg 410', postal_code: '1047 HE', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Logs.rent',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 6,
    deals_count: 3,
  },
  {
    id: 'comp_core_djobba_works',
    name: 'Djobba.works',
    company_tag: '#djobba.works',
    company_tags: ['#djobba.works', '#djobba'],
    domain: 'djobba.works',
    website: 'https://djobba.works',
    industry: 'Recruitment, Detachering & Flexwerk',
    size: '50-200',
    phone: '+31 20 808 1110',
    address: { street: 'Stationsplein 45', postal_code: '3013 AK', city: 'Rotterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Djobba.works',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 11,
    deals_count: 5,
  },
  {
    id: 'comp_core_trusting_work',
    name: 'Trusting Work',
    company_tag: '#trusting-work',
    company_tags: ['#trusting-work'],
    domain: 'trustingwork.nl',
    website: 'https://trustingwork.nl',
    industry: 'HR, Arbeidsbemiddeling & Coaching',
    size: '10-50',
    phone: '+31 20 808 1111',
    address: { street: 'Maliebaan 80', postal_code: '3581 GW', city: 'Utrecht', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Trusting Work',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 7,
    deals_count: 3,
  },
  {
    id: 'comp_core_woningvry',
    name: 'Woningvry',
    company_tag: '#woningvry',
    company_tags: ['#woningvry'],
    domain: 'woningvry.nl',
    website: 'https://woningvry.nl',
    industry: 'Vastgoed, Huisvesting & Verhuur',
    size: '10-50',
    phone: '+31 20 808 1112',
    address: { street: 'Apollolaan 151', postal_code: '1077 AR', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Woningvry',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 6,
    deals_count: 4,
  },
  {
    id: 'comp_core_xabi_world',
    name: 'Xabi World',
    company_tag: '#xabi-world',
    company_tags: ['#xabi-world', '#xabi'],
    domain: 'xabiworld.com',
    website: 'https://xabiworld.com',
    industry: 'International Commerce & Media',
    size: '10-50',
    phone: '+31 20 808 1113',
    address: { street: 'Damrak 70', postal_code: '1012 LM', city: 'Amsterdam', country: 'Nederland' },
    org_id: 'default_org',
    company_name: 'Xabi World',
    is_crmos_core: true,
    allowed_companies: [...CORE_PARTNER_OPTIONS],
    contacts_count: 5,
    deals_count: 2,
  },
];

/**
 * Multi-company visibility check:
 * - Admin: sees ALL data from ALL companies.
 * - CRMos Core Group (CRMos, VVC, Quantum Initium, Logs Rent, Djobba, Trusting Work):
 *   Can see their own company's data AND the shared CRMos core dataset (HubSpot data, etc.).
 * - Other Companies: can ONLY see data belonging to their own company or explicitly shared with them.
 */
export function canUserAccessRecord(
  user: User | null,
  record: {
    org_id?: string;
    company_name?: string;
    company?: string;
    allowed_companies?: string[];
    is_crmos_core?: boolean;
    source?: string;
  }
): boolean {
  if (!user) return false;

  // 1. Super Admin or Platform Admin sees ALL data across all companies
  const isSuperAdmin =
    user.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user.email?.toLowerCase() === 'info@crmos.one' ||
    user.is_super_admin === true ||
    user.role === 'admin';

  if (isSuperAdmin) {
    return true;
  }

  const userCompanyName = normalizeCompanyName(user.company_name);
  const userOrgId = user.org_id;
  const isUserInCoreEcosystem = isCoreEcosystemCompany(user.company_name);

  // 2. Direct organization ID match
  if (record.org_id && userOrgId && record.org_id === userOrgId) {
    return true;
  }

  // 3. Direct company name match (only match tenant company name, not customer company)
  const recordCompanyName = normalizeCompanyName(record.company_name);
  if (recordCompanyName && userCompanyName && recordCompanyName === userCompanyName) {
    return true;
  }

  // 4. Explicit multi-company sharing array
  if (record.allowed_companies && Array.isArray(record.allowed_companies)) {
    const hasExplicitAccess = record.allowed_companies.some((ac) => {
      const normalizedAllowed = normalizeCompanyName(ac);
      return (
        normalizedAllowed === userCompanyName ||
        (isUserInCoreEcosystem && isCoreEcosystemCompany(normalizedAllowed))
      );
    });
    if (hasExplicitAccess) return true;
  }

  // 5. CRMos Core Data (HubSpot data, default_org, crmosone-dev):
  // Visibile to CRMos, VVC, Quantum Initium, Logs Rent, Djobba, and Trusting Work
  const isCoreRecord =
    record.is_crmos_core === true ||
    record.org_id === 'default_org' ||
    record.org_id === 'crmosone-dev' ||
    record.org_id === 'org1' ||
    record.source === 'HubSpot CRM' ||
    (record.allowed_companies && record.allowed_companies.some((c) => isCoreEcosystemCompany(c)));

  if (isCoreRecord && isUserInCoreEcosystem) {
    return true;
  }

  // 6. Otherwise: denied (strictly isolated)
  return false;
}

/**
 * Filters a collection of records for the active user
 */
export function filterRecordsForUser<
  T extends {
    org_id?: string;
    company_name?: string;
    company?: string;
    allowed_companies?: string[];
    is_crmos_core?: boolean;
    source?: string;
  }
>(user: User | null, records: T[], adminCompanyFilter?: string | null): T[] {
  if (!user) return [];

  const isSuperAdmin =
    user.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user.email?.toLowerCase() === 'info@crmos.one' ||
    user.is_super_admin === true ||
    user.role === 'admin';

  // If Admin chose a specific company to view from the switcher
  if (isSuperAdmin && adminCompanyFilter && adminCompanyFilter !== 'all') {
    if (adminCompanyFilter === 'crmos_core') {
      return records.filter((r) => {
        const comp = normalizeCompanyName(r.company_name || r.company);
        return (
          isCoreEcosystemCompany(comp) ||
          r.is_crmos_core === true ||
          r.org_id === 'default_org' ||
          r.org_id === 'crmosone-dev' ||
          (r.allowed_companies && r.allowed_companies.some((c) => isCoreEcosystemCompany(c)))
        );
      });
    }

    const target = normalizeCompanyName(adminCompanyFilter);
    return records.filter((r) => {
      const comp = normalizeCompanyName(r.company_name || r.company);
      const allowed = (r.allowed_companies || []).map(normalizeCompanyName);
      return comp === target || allowed.includes(target) || r.org_id === adminCompanyFilter;
    });
  }

  // Normal access check
  return records.filter((record) => canUserAccessRecord(user, record));
}
