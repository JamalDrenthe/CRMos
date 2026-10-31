/**
 * Seed all 14 Enterprise & Company API keys directly into Firestore REST collection `crm_api_keys`
 */

const https = require('https');

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev';

const KEYS_TO_SEED = [
  {
    id: 'key_master_jamaldrenthe',
    name: 'Master Ecosystem Key (Jamal Drenthe)',
    key_hash: 'crm_live_master_jamaldrenthe_2026_all_ecosystem',
    token_preview: 'crm_live_master...',
    full_token: 'crm_live_master_jamaldrenthe_2026_all_ecosystem',
    company_name: 'Alle 13 Bedrijven',
    environment: 'live',
    scopes: ['*'],
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
    environment: 'live',
    scopes: ['vvc:*', 'read:contacts', 'read:teams'],
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
    environment: 'live',
    scopes: ['quantum:*', 'read:contacts', 'read:deals'],
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
    environment: 'live',
    scopes: ['immigratiepunt:*', 'read:contacts'],
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
    environment: 'live',
    scopes: ['spontiva:*', 'read:candidates', 'apply:jobs'],
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
    environment: 'live',
    scopes: ['investbotiq:*', 'read:deals'],
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
    environment: 'live',
    scopes: ['boostplug:*', 'read:contacts', 'read:deals'],
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
    environment: 'live',
    scopes: ['crmos:*', 'admin'],
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
    environment: 'live',
    scopes: ['zheavenzy:*', 'read:contacts'],
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
    environment: 'live',
    scopes: ['logs_rent:*', 'read:deals'],
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
    environment: 'live',
    scopes: ['djobba_works:*', 'read:candidates'],
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
    environment: 'live',
    scopes: ['trusting_work:*', 'read:contacts', 'read:candidates'],
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
    environment: 'live',
    scopes: ['woningvry:*', 'read:deals', 'read:contacts'],
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
    environment: 'live',
    scopes: ['xabi_world:*', 'read:contacts'],
    org_id: 'default_org',
    created_by_user: 'Jamal Drenthe',
    status: 'active',
  },
];

function toFirestoreFields(data) {
  const fields = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { integerValue: String(val) };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => ({ stringValue: String(v) })),
        },
      };
    }
  }
  return fields;
}

function writeDoc(docId, data) {
  return new Promise((resolve) => {
    const fields = toFirestoreFields({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const body = JSON.stringify({ fields });
    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/crm_api_keys/${encodeURIComponent(docId)}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (d) => { responseBody += d; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, id: docId });
      });
    });

    req.on('error', (e) => {
      resolve({ error: e.message, id: docId });
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Seeding ${KEYS_TO_SEED.length} API keys to Firestore project: ${PROJECT_ID}...`);
  for (const keyDef of KEYS_TO_SEED) {
    const res = await writeDoc(keyDef.id, keyDef);
    console.log(`  - [${res.statusCode || res.error}] ${keyDef.name} (${keyDef.full_token})`);
  }
  console.log('Klaar met inrichten van alle bedrijfs API keys!');
}

main();
