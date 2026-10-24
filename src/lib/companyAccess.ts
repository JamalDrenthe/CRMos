import { CRMOS_CORE_COMPANIES, isCoreEcosystemCompany, type User } from '@/types';
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
 * Standard list of core ecosystem partners available for quick selection
 */
export const CORE_PARTNER_OPTIONS = [
  'CRMos',
  'VVC',
  'Quantum Initium',
  'Logs Rent',
  'Djobba',
  'Trusting Work',
] as const;

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
