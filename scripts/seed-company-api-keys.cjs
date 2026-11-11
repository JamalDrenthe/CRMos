/**
 * Seed all 14 Enterprise & Company API keys, 9 CRM Teams, and 7 Core Referral Leaders
 * directly into live Firebase Cloud Firestore (`crmosone-dev`) using Firebase Auth REST token exchange.
 *
 * SECURITY: dit script genereert bij elke run NIEUWE, willekeurige API keys.
 * Alleen de SHA-256 hash wordt in Firestore (`crm_api_keys`) opgeslagen.
 * De plaintext keys worden eenmalig naar stdout geschreven. Bewaar ze in een
 * wachtwoordmanager en zet ze als Cloudflare secret CRMOS_API_KEYS_JSON.
 *
 * Vereist: CRMOS_FIREBASE_AGENT_PASSWORD (agent login) in env. Geen defaults.
 */

const crypto = require('node:crypto');

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';
const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || '';
const AGENT_EMAIL = process.env.CRMOS_FIREBASE_AGENT_EMAIL || 'api-agent@crmos.one';
const AGENT_PASSWORD = process.env.CRMOS_FIREBASE_AGENT_PASSWORD || '';

if (!AGENT_PASSWORD || !FIREBASE_WEB_API_KEY) {
  console.error('Zet CRMOS_FIREBASE_AGENT_PASSWORD en VITE_FIREBASE_API_KEY in je env voordat je seedt.');
  process.exit(1);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newKey = () => `crm_live_${crypto.randomBytes(24).toString('hex')}`;

// Metadata per bedrijf (geen secrets)
const COMPANY_KEY_DEFS = [
  { id: 'master-all-companies', name: 'Master Ecosystem Key (Jamal Drenthe)', company: 'Alle 13 Bedrijven (Master View)', tag: 'ALL', role: 'super_admin', scopes: ['*'] },
  { id: 'vvc', name: 'VVC API Key', company: 'vvc (verdienende vrienden club)', tag: 'VVC', role: 'partner', scopes: ['vvc:*'] },
  { id: 'quantum-initium', name: 'Quantum Initium API Key', company: 'quantum initium', tag: 'QUANTUM_INITIUM', role: 'partner', scopes: ['quantum_initium:*'] },
  { id: 'immigratiepunt', name: 'Immigratiepunt API Key', company: 'immigratiepunt', tag: 'IMMIGRATIEPUNT', role: 'partner', scopes: ['immigratiepunt:*'] },
  { id: 'spontiva', name: 'Spontiva API Key', company: 'spontiva', tag: 'SPONTIVA', role: 'partner', scopes: ['spontiva:*'] },
  { id: 'investbotiq', name: 'Investbotiq API Key', company: 'Investbotiq', tag: 'INVESTBOTIQ', role: 'partner', scopes: ['investbotiq:*'] },
  { id: 'boostplug', name: 'Boostplug API Key', company: 'boostplug', tag: 'BOOSTPLUG', role: 'partner', scopes: ['boostplug:*'] },
  { id: 'crmos', name: 'CRMos Core Platform Key', company: 'crmos', tag: 'CRMOS', role: 'admin', scopes: ['*'] },
  { id: 'zheavenzy', name: 'Zheavenzy API Key', company: 'zheavenzy', tag: 'ZHEAVENZY', role: 'partner', scopes: ['zheavenzy:*'] },
  { id: 'logs-rent', name: 'Logs.rent API Key', company: 'logs.rent', tag: 'LOGS_RENT', role: 'partner', scopes: ['logs_rent:*'] },
  { id: 'djobba-works', name: 'Djobba.works API Key', company: 'djobba.works', tag: 'DJOBBA_WORKS', role: 'partner', scopes: ['djobba_works:*'] },
  { id: 'trusting-work', name: 'Trusting Work API Key', company: 'trusting work', tag: 'TRUSTING_WORK', role: 'partner', scopes: ['trusting_work:*'] },
  { id: 'woningvry', name: 'Woningvry API Key', company: 'woningvry', tag: 'WONINGVRY', role: 'partner', scopes: ['woningvry:*'] },
  { id: 'xabi-world', name: 'Xabi World API Key', company: 'xabi world', tag: 'XABI_WORLD', role: 'partner', scopes: ['xabi_world:*'] },
];

// Genereer verse keys + hun veilige (gehashte) opslagrecords
const GENERATED_KEYS = COMPANY_KEY_DEFS.map((def) => ({ ...def, key: newKey() }));
const KEYS_TO_SEED = GENERATED_KEYS.map((def) => ({
  id: `key_${def.id}`,
  name: def.name,
  token_hash: sha256(def.key),
  token_preview: `${def.key.substring(0, 13)}...`,
  company: def.company,
  company_name: def.company,
  tag: def.tag,
  company_tag: `#${def.tag.toLowerCase()}`,
  role: def.role,
  environment: 'live',
  scopes: def.scopes,
  org_id: 'default_org',
  created_by_user: 'Jamal Drenthe',
  status: 'active',
}));
const PUBLIC_KEYS_JSON = KEYS_TO_SEED.map(({ token_hash, ...rest }) => ({
  ...rest,
  key_hash: token_hash,
}));


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

  // 1. Seed Core Referral Leaders into `crm_contacts` (under both hs_cont_* and cont_core_* so they appear on page 1)
  console.log(`1. Seeding 8 Core Leaders (Jamal + 7 Referral Leaders) into crm_contacts...`);
  for (const leader of CORE_LEADERS_TO_SEED) {
    const coreId = leader.id.startsWith('cont_core_')
      ? leader.id
      : `cont_core_${leader.first_name.toLowerCase()}_salesmates`;
    for (const docId of Array.from(new Set([leader.id, coreId]))) {
      const res = await patchFirestoreDoc(
        'crm_contacts',
        docId,
        {
          ...leader,
          id: docId,
          canonical_id: leader.id,
          created_at: '2026-01-15T09:00:00.000Z',
          updated_at: now,
        },
        idToken
      );
      console.log(`  [${res.ok ? 'OK' : 'FAIL'}] crm_contacts/${docId} (${leader.first_name} ${leader.last_name}) -> HTTP ${res.status}`);
    }
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
      api_keys_json: JSON.stringify(PUBLIC_KEYS_JSON),
      teams_json: JSON.stringify(TEAMS_TO_SEED),
      total_keys: KEYS_TO_SEED.length,
      total_teams: TEAMS_TO_SEED.length,
      updated_at: now,
    },
    idToken
  );
  console.log(`  [${regRes.ok ? 'OK' : 'FAIL'}] organizations/crmos_ecosystem_registry -> HTTP ${regRes.status}`);

  for (const k of KEYS_TO_SEED) {
    // Alleen de SHA-256 hash wordt opgeslagen; de plaintext key staat nergens in Firestore.
    const res = await patchFirestoreDoc(
      'crm_api_keys',
      k.id,
      {
        ...k,
        entity_type: 'crm_api_key',
        created_at: now,
        updated_at: now,
      },
      idToken
    );
    console.log(`  [${res.ok ? 'OK' : 'FAIL'}] crm_api_keys/${k.id} (${k.company_name}) -> HTTP ${res.status}`);
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

  console.log('\n=== NIEUWE API KEYS (eenmalig zichtbaar, sla veilig op) ===');
  for (const k of GENERATED_KEYS) {
    console.log(`${k.company} [${k.tag}]: ${k.key}`);
  }
  console.log('\n=== Cloudflare secret CRMOS_API_KEYS_JSON ===');
  console.log(JSON.stringify(GENERATED_KEYS.map((k) => ({
    id: `key_${k.id}`,
    name: k.name,
    company: k.company,
    tag: k.tag,
    role: k.role,
    key_hash: sha256(k.key),
    status: 'active',
  }))));
  console.log('\nDone seeding live Firebase Cloud Firestore (`crmosone-dev`)!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
