/**
 * Seed all 14 Enterprise & Company API keys, 9 CRM Teams, and 7 Core Referral Leaders
 * directly into live Firebase Cloud Firestore (`crmosone-dev`) using Firebase Auth REST token exchange.
 */

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';
const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo';
const AGENT_EMAIL = process.env.CRMOS_FIREBASE_AGENT_EMAIL || 'api-agent@crmos.one';
const AGENT_PASSWORD = process.env.CRMOS_FIREBASE_AGENT_PASSWORD || 'CRMosAgent2026!Secure';

const KEYS_TO_SEED = [
  {
    id: 'key_master_jamaldrenthe',
    name: 'Master Ecosystem Key (Jamal Drenthe)',
    key_hash: 'crm_live_master_jamaldrenthe_2026_all_ecosystem',
    token_preview: 'crm_live_master...',
    full_token: 'crm_live_master_jamaldrenthe_2026_all_ecosystem',
    company_name: 'Alle 13 Bedrijven',
    company_tag: '#all',
    environment: 'live',
    scopes: ['*', 'read:all', 'write:all', 'admin'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_vvc',
    name: 'VVC API Key',
    key_hash: 'crm_live_vvc_verdienende_vrienden_club_2026',
    token_preview: 'crm_live_vvc...',
    full_token: 'crm_live_vvc_verdienende_vrienden_club_2026',
    company_name: 'vvc (verdienende vrienden club)',
    company_tag: '#vvc',
    environment: 'live',
    scopes: ['vvc:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_quantum_initium',
    name: 'Quantum Initium API Key',
    key_hash: 'crm_live_quantum_initium_enterprise_2026',
    token_preview: 'crm_live_quantum...',
    full_token: 'crm_live_quantum_initium_enterprise_2026',
    company_name: 'quantum initium',
    company_tag: '#quantum-initium',
    environment: 'live',
    scopes: ['quantum:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_immigratiepunt',
    name: 'Immigratiepunt API Key',
    key_hash: 'crm_live_immigratiepunt_portal_2026',
    token_preview: 'crm_live_immigratie...',
    full_token: 'crm_live_immigratiepunt_portal_2026',
    company_name: 'immigratiepunt',
    company_tag: '#immigratiepunt',
    environment: 'live',
    scopes: ['immigratiepunt:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_spontiva',
    name: 'Spontiva API Key',
    key_hash: 'crm_live_spontiva_recruitment_2026',
    token_preview: 'crm_live_spontiva...',
    full_token: 'crm_live_spontiva_recruitment_2026',
    company_name: 'spontiva',
    company_tag: '#spontiva',
    environment: 'live',
    scopes: ['spontiva:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_investbotiq',
    name: 'Investbotiq API Key',
    key_hash: 'crm_live_investbotiq_capital_2026',
    token_preview: 'crm_live_investbotiq...',
    full_token: 'crm_live_investbotiq_capital_2026',
    company_name: 'Investbotiq',
    company_tag: '#investbotiq',
    environment: 'live',
    scopes: ['investbotiq:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_boostplug',
    name: 'Boostplug API Key',
    key_hash: 'crm_live_boostplug_energy_iot_2026',
    token_preview: 'crm_live_boostplug...',
    full_token: 'crm_live_boostplug_energy_iot_2026',
    company_name: 'boostplug',
    company_tag: '#boostplug',
    environment: 'live',
    scopes: ['boostplug:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_crmos',
    name: 'CRMos Core Platform Key',
    key_hash: 'crm_live_crmos_core_platform_2026',
    token_preview: 'crm_live_crmos...',
    full_token: 'crm_live_crmos_core_platform_2026',
    company_name: 'crmos',
    company_tag: '#crmos',
    environment: 'live',
    scopes: ['crmos:*', 'read:all', 'write:all', 'admin'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_zheavenzy',
    name: 'Zheavenzy API Key',
    key_hash: 'crm_live_zheavenzy_atelier_2026',
    token_preview: 'crm_live_zheavenzy...',
    full_token: 'crm_live_zheavenzy_atelier_2026',
    company_name: 'zheavenzy',
    company_tag: '#zheavenzy',
    environment: 'live',
    scopes: ['zheavenzy:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_logs_rent',
    name: 'Logs.rent API Key',
    key_hash: 'crm_live_logs_rent_logistics_2026',
    token_preview: 'crm_live_logs...',
    full_token: 'crm_live_logs_rent_logistics_2026',
    company_name: 'logs.rent',
    company_tag: '#logs-rent',
    environment: 'live',
    scopes: ['logs_rent:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_djobba_works',
    name: 'Djobba.works API Key',
    key_hash: 'crm_live_djobba_works_freelance_2026',
    token_preview: 'crm_live_djobba...',
    full_token: 'crm_live_djobba_works_freelance_2026',
    company_name: 'djobba.works',
    company_tag: '#djobba-works',
    environment: 'live',
    scopes: ['djobba_works:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_trusting_work',
    name: 'Trusting Work API Key',
    key_hash: 'crm_live_trusting_work_staffing_2026',
    token_preview: 'crm_live_trusting...',
    full_token: 'crm_live_trusting_work_staffing_2026',
    company_name: 'trusting work',
    company_tag: '#trusting-work',
    environment: 'live',
    scopes: ['trusting_work:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_woningvry',
    name: 'Woningvry API Key',
    key_hash: 'crm_live_woningvry_realestate_2026',
    token_preview: 'crm_live_woningvry...',
    full_token: 'crm_live_woningvry_realestate_2026',
    company_name: 'woningvry',
    company_tag: '#woningvry',
    environment: 'live',
    scopes: ['woningvry:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
  {
    id: 'key_xabi_world',
    name: 'Xabi World API Key',
    key_hash: 'crm_live_xabi_world_international_2026',
    token_preview: 'crm_live_xabi...',
    full_token: 'crm_live_xabi_world_international_2026',
    company_name: 'xabi world',
    company_tag: '#xabi-world',
    environment: 'live',
    scopes: ['xabi_world:*', 'read:all', 'write:all'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
];

const CORE_LEADERS_TO_SEED = [
  {
    id: 'hs_cont_596065256635',
    first_name: 'Jamal',
    last_name: 'Drenthe',
    firstName: 'Jamal',
    lastName: 'Drenthe',
    email: 'info@jamaldrenthe.com',
    phone: '+31600000000',
    title: 'Founder & CEO',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva', '#investbotiq', '#boostplug'],
    tags: ['Founder', 'Directie', 'Teamleider', 'Actief Team', '#vvc'],
    vvc_tag: 'VVC-JAMAL-0001',
    code: 'VVC-JAMAL-0001',
    team_id: 'team_jamal_drenthe',
    team_name: 'Team Jamal Drenthe',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe (Founder)',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Founder & CEO van het CRMos ecosysteem en de 13 aangesloten bedrijven.',
  },
  {
    id: 'hs_cont_596107111629',
    first_name: 'Reyhan',
    last_name: 'Salesmates',
    firstName: 'Reyhan',
    lastName: 'Salesmates',
    email: 'reyhan@verdienendevrienden.club',
    phone: '+31685569180',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-REYHAN-0101',
    code: 'VVC-REYHAN-0101',
    team_id: 'team_reyhan',
    team_name: 'Team Reyhan',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596134466772',
    first_name: 'Julius',
    last_name: 'Salesmates',
    firstName: 'Julius',
    lastName: 'Salesmates',
    email: 'julius@verdienendevrienden.club',
    phone: '+31639684103',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-JULIUS-0102',
    code: 'VVC-JULIUS-0102',
    team_id: 'team_julius',
    team_name: 'Team Julius',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596054064370',
    first_name: 'Jayden',
    last_name: 'Salesmates',
    firstName: 'Jayden',
    lastName: 'Salesmates',
    email: 'jayden@verdienendevrienden.club',
    phone: '+31639496400',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-JAYDEN-0103',
    code: 'VVC-JAYDEN-0103',
    team_id: 'team_jayden',
    team_name: 'Team Jayden',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596206040256',
    first_name: 'Deniz',
    last_name: 'Salesmates',
    firstName: 'Deniz',
    lastName: 'Salesmates',
    email: 'deniz@verdienendevrienden.club',
    phone: '+31684399360',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-DENIZ-0104',
    code: 'VVC-DENIZ-0104',
    team_id: 'team_deniz',
    team_name: 'Team Deniz',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'cont_core_boas_salesmates',
    first_name: 'Boas',
    last_name: 'Salesmates',
    firstName: 'Boas',
    lastName: 'Salesmates',
    email: 'boas@verdienendevrienden.club',
    phone: '+31624891042',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-BOAS-8421',
    code: 'VVC-BOAS-8421',
    team_id: 'team_boas',
    team_name: 'Team Boas',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596116383965',
    first_name: 'Fawzan',
    last_name: 'Salesmates',
    firstName: 'Fawzan',
    lastName: 'Salesmates',
    email: 'fawzan@verdienendevrienden.club',
    phone: '+31683855525',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-FAWZAN-0106',
    code: 'VVC-FAWZAN-0106',
    team_id: 'team_fawzan',
    team_name: 'Team Fawzan',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
  {
    id: 'hs_cont_596209818863',
    first_name: 'Ricardo',
    last_name: 'Salesmates',
    firstName: 'Ricardo',
    lastName: 'Salesmates',
    email: 'ricardo@verdienendevrienden.club',
    phone: '+31634035033',
    title: 'Teamleider & Sales Partner',
    company: 'VVC (Verdienende Vrienden Club)',
    company_tags: ['#vvc', '#crmos', '#spontiva'],
    tags: ['Salesmates', 'Teamleider', 'Actief Team', 'Ref: Jamal Drenthe', '#vvc'],
    vvc_tag: 'VVC-RICARDO-0107',
    code: 'VVC-RICARDO-0107',
    team_id: 'team_ricardo',
    team_name: 'Team Ricardo',
    team_status: 'active',
    referred_by_name: 'Jamal Drenthe',
    can_start_team: true,
    team_request_status: 'approved',
    status: 'customer',
    org_id: 'default_org',
    notes: 'Rechtstreeks aangeleverd door Jamal Drenthe. Heeft directe bevoegdheid om een eigen team te starten en te leiden.',
  },
];

const TEAMS_TO_SEED = [
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
  },
];

function toFirestoreFields(data) {
  const fields = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) fields[key] = { integerValue: String(val) };
      else fields[key] = { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => ({ stringValue: String(item) })),
        },
      };
    }
  }
  return { fields };
}

async function getFirebaseIdToken() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: AGENT_EMAIL,
      password: AGENT_PASSWORD,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firebase Auth signIn failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.idToken;
}

async function patchFirestoreDoc(collection, docId, payload, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(toFirestoreFields(payload)),
  });
  return { ok: res.ok, status: res.status };
}

async function main() {
  console.log(`Authenticating with Firebase Auth (${AGENT_EMAIL}) on project: ${PROJECT_ID}...`);
  const idToken = await getFirebaseIdToken();
  console.log(`Authenticated! Received valid Firebase ID Token (${idToken.slice(0, 24)}...).\n`);

  const now = new Date().toISOString();

  // 1. Seed Core Referral Leaders into `crm_contacts`
  console.log(`1. Seeding 8 Core Leaders (Jamal + 7 Referral Leaders) into crm_contacts...`);
  for (const leader of CORE_LEADERS_TO_SEED) {
    const res = await patchFirestoreDoc(
      'crm_contacts',
      leader.id,
      {
        ...leader,
        created_at: '2026-01-15T09:00:00.000Z',
        updated_at: now,
      },
      idToken
    );
    console.log(`  [${res.ok ? 'OK' : 'FAIL'}] crm_contacts/${leader.id} (${leader.first_name} ${leader.last_name}) -> HTTP ${res.status}`);
  }

  // 2. Seed Ecosystem Registry + Individual API Keys & Teams into `organizations`
  console.log(`\n2. Seeding Ecosystem Registry (14 API Keys + 9 Teams) into organizations...`);
  const regRes = await patchFirestoreDoc(
    'organizations',
    'crmos_ecosystem_registry',
    {
      id: 'crmos_ecosystem_registry',
      name: 'CRMos Enterprise Ecosystem Registry (13 Companies, 14 API Keys, 9 Teams)',
      org_id: 'default_org',
      api_keys_json: JSON.stringify(KEYS_TO_SEED),
      teams_json: JSON.stringify(TEAMS_TO_SEED),
      total_keys: KEYS_TO_SEED.length,
      total_teams: TEAMS_TO_SEED.length,
      updated_at: now,
    },
    idToken
  );
  console.log(`  [${regRes.ok ? 'OK' : 'FAIL'}] organizations/crmos_ecosystem_registry -> HTTP ${regRes.status}`);

  for (const k of KEYS_TO_SEED) {
    const res = await patchFirestoreDoc(
      'organizations',
      `apikey_${k.id}`,
      {
        ...k,
        entity_type: 'crm_api_key',
        created_at: now,
        updated_at: now,
      },
      idToken
    );
    console.log(`  [${res.ok ? 'OK' : 'FAIL'}] organizations/apikey_${k.id} (${k.company_name}) -> HTTP ${res.status}`);
  }

  for (const t of TEAMS_TO_SEED) {
    const res = await patchFirestoreDoc(
      'organizations',
      `team_${t.id}`,
      {
        ...t,
        entity_type: 'crm_team',
        created_at: '2026-01-15T09:00:00.000Z',
        updated_at: now,
      },
      idToken
    );
    console.log(`  [${res.ok ? 'OK' : 'FAIL'}] organizations/team_${t.id} (${t.name}) -> HTTP ${res.status}`);
  }

  console.log('\nDone seeding live Firebase Cloud Firestore (`crmosone-dev`)!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
