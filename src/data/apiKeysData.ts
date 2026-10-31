/**
 * CRMos Ecosystem Officiële API Keys & Configuratie voor AI Agents
 * 
 * Direct te kopiëren en te plakken voor externe AI agents, automations en partners.
 */

export interface CompanyApiKeyDefinition {
  id: string;
  key: string;
  company: string;
  tag: string;
  name: string;
  role: 'super_admin' | 'admin' | 'partner';
  description: string;
}

export const MASTER_ECOSYSTEM_API_KEY: CompanyApiKeyDefinition = {
  id: 'master-all-companies',
  key: 'crm_live_master_jamaldrenthe_2026_all_ecosystem',
  company: 'Alle 13 Bedrijven (Master View)',
  tag: 'ALL',
  name: 'Master Ecosystem Key (Jamal Drenthe)',
  role: 'super_admin',
  description: 'Onbeperkte toegang tot alle 13 bedrijven, alle contacten, referral teams, deals, vacatures en communicatietags in CRMos.',
};

export const COMPANY_API_KEYS: CompanyApiKeyDefinition[] = [
  {
    id: 'vvc',
    key: 'crm_live_vvc_verdienende_vrienden_club_2026',
    company: 'vvc (verdienende vrienden club)',
    tag: 'VVC',
    name: 'VVC API Key',
    role: 'partner',
    description: 'Toegang tot alle VVC aanmeldingen, referral-teams en community contacten.',
  },
  {
    id: 'quantum-initium',
    key: 'crm_live_quantum_initium_enterprise_2026',
    company: 'quantum initium',
    tag: 'QUANTUM_INITIUM',
    name: 'Quantum Initium API Key',
    role: 'partner',
    description: 'Toegang tot enterprise finance, AI compute pipelines en corporate contacten.',
  },
  {
    id: 'immigratiepunt',
    key: 'crm_live_immigratiepunt_portal_2026',
    company: 'immigratiepunt',
    tag: 'IMMIGRATIEPUNT',
    name: 'Immigratiepunt API Key',
    role: 'partner',
    description: 'Toegang tot expat dossiers, visa/relocatie contacten en aanvragen.',
  },
  {
    id: 'spontiva',
    key: 'crm_live_spontiva_recruitment_2026',
    company: 'spontiva',
    tag: 'SPONTIVA',
    name: 'Spontiva API Key',
    role: 'partner',
    description: 'Toegang tot recruitment, No Cure No Pay kandidaten en matching dossiers.',
  },
  {
    id: 'investbotiq',
    key: 'crm_live_investbotiq_capital_2026',
    company: 'Investbotiq',
    tag: 'INVESTBOTIQ',
    name: 'Investbotiq API Key',
    role: 'partner',
    description: 'Toegang tot investeerdersrelaties, trading pools en kapitaalcontacten.',
  },
  {
    id: 'boostplug',
    key: 'crm_live_boostplug_energy_iot_2026',
    company: 'boostplug',
    tag: 'BOOSTPLUG',
    name: 'Boostplug API Key',
    role: 'partner',
    description: 'Toegang tot EV/IoT laadpalen, energie-contracten en zakelijke deals.',
  },
  {
    id: 'crmos',
    key: 'crm_live_crmos_core_platform_2026',
    company: 'crmos',
    tag: 'CRMOS',
    name: 'CRMos Core Platform Key',
    role: 'admin',
    description: 'Toegang tot kernplatform CRM-operaties, licenties en workflows.',
  },
  {
    id: 'zheavenzy',
    key: 'crm_live_zheavenzy_atelier_2026',
    company: 'zheavenzy',
    tag: 'ZHEAVENZY',
    name: 'Zheavenzy API Key',
    role: 'partner',
    description: 'Toegang tot luxe atelier, high-ticket klanten en lifestyle relaties.',
  },
  {
    id: 'logs-rent',
    key: 'crm_live_logs_rent_logistics_2026',
    company: 'logs.rent',
    tag: 'LOGS_RENT',
    name: 'Logs.rent API Key',
    role: 'partner',
    description: 'Toegang tot compute & hardware verhuur, logistiek en datacenters.',
  },
  {
    id: 'djobba-works',
    key: 'crm_live_djobba_works_freelance_2026',
    company: 'djobba.works',
    tag: 'DJOBBA_WORKS',
    name: 'Djobba.works API Key',
    role: 'partner',
    description: 'Toegang tot Europese freelance marktplaats, opdrachten en zzp talenten.',
  },
  {
    id: 'trusting-work',
    key: 'crm_live_trusting_work_staffing_2026',
    company: 'trusting work',
    tag: 'TRUSTING_WORK',
    name: 'Trusting Work API Key',
    role: 'partner',
    description: 'Toegang tot IT-detachering, uitzendprofielen en opdrachtgevers.',
  },
  {
    id: 'woningvry',
    key: 'crm_live_woningvry_realestate_2026',
    company: 'woningvry',
    tag: 'WONINGVRY',
    name: 'Woningvry API Key',
    role: 'partner',
    description: 'Toegang tot vastgoedbeleggingen, huurders en transformatieprojecten.',
  },
  {
    id: 'xabi-world',
    key: 'crm_live_xabi_world_international_2026',
    company: 'xabi world',
    tag: 'XABI_WORLD',
    name: 'Xabi World API Key',
    role: 'partner',
    description: 'Toegang tot internationale media, branding partnerships en merchandising.',
  },
];

export const ALL_ACTIVE_API_KEYS = [MASTER_ECOSYSTEM_API_KEY, ...COMPANY_API_KEYS];
