# CRMos security model

Repository: `JamalDrenthe/CRMos` (main @ dda426a). Live at https://crmos.one; `/api/v1/health` reports version 2.2.0 and Firebase project `crmosone-dev`, so the deployed API matches `main`.
No infrastructure repository *(user)*: hosting is Cloudflare Pages (dashboard config, not in git); `firebase.json` / `firestore.rules` are the only infra-as-code.
Status: statements marked *(user)* come from Jamal (2026-11-11); everything else is inferred from the code. Keep this file up to date: security scans start from it.

## System overview and trust boundaries
- Browser SPA (React/Vite) talks directly to Firebase Auth and Firestore with the public web config; Firestore security rules are the only server-side control for that path.
- Cloudflare Pages Functions expose REST API v1 (`functions/api/[[catchall]].ts`, `functions/api/v1/[[path]].ts`, both calling `src/server/crmosApiCore.ts`). The API talks to Firestore over REST using one shared Firebase Auth "agent" user signed in with email/password, so every API request reaches Firestore as an authenticated user regardless of the caller.
- Partner/ecosystem companies (VVC, InvestBotIQ, Quantum Initium, Immigratiepunt, Spontiva, Boostplug, Zheavenzy, logs.rent, Djobba Works, Trusting Work, WoningVry, Xabi World) call the API with per-company keys from `src/data/apiKeysData.ts`; outbound webhooks go to partner URLs with shared secrets (`DEFAULT_ECOSYSTEM_WEBHOOKS`).
- Boundaries: internet -> Pages Functions; internet -> Firestore (rules); API -> Firestore (agent user); CRMos -> partner webhooks; browser -> Twilio/HubSpot/PDOK/OSM/Mapbox.

## Components
| Name | Code |
|---|---|
| Web App | `src/pages/**`, `src/components/**`, `src/stores/**`, `src/lib/**`, `index.html` |
| REST API | `functions/**`, `src/server/crmosApiCore.ts`, `src/data/apiKeysData.ts`, `src/services/crmosApiClient.ts` |
| Firestore & Auth | `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `src/services/firestoreService.ts`, `src/stores/authStore.ts` |
| Integrations | `src/services/{hubspotService,twilioService,b2bEnrichmentPipeline,mapboxService,openMapService,vvcTagService,crmSearchEngine}.ts` |
| Dev Server | `vite.config.ts`, `src/server/vvcApiPlugin.ts`, `src/server/twilioProxyPlugin.ts` (Vite dev only, not deployed; in scope *(user)*) |
| Scripts | `scripts/**` (seeding/setup, run manually; in scope *(user)*) |

## Entry points and who can reach them
- `https://crmos.one/api/v1/*` (anyone on the internet; CORS `*`): health, keys, search, vvc lookup, contacts (+upsert), deals, activities, candidates, webhooks (+dispatch/test), teams, companies. API key is read from `X-CRMOS-API-KEY`, `X-API-Key`, `X-VVC-Token`, `Authorization` or `?api_key=`; requests without a known key appear to be served as "Public / Ecosystem Guest" with scope ALL.
- Firestore directly (anyone with the public web API key): many `crm_*` collections allow `read: if true` and unauthenticated writes with loose key checks; most others allow any signed-in user. Self-registration exists (`RegisterPage.tsx`, `authStore.ts`).
- Web app routes for signed-in users, including admin masterview (admin = hardcoded emails or `admin` claim).

## Assets and data sensitivity
- **The live Firestore project `crmosone-dev` holds real customer and candidate data** *(user)*. Treat it as production.
- Contact/lead PII (names, emails, phones, addresses, notes) in `crm_contacts`, `crm_companies`, `crm_deals`, `crm_activities`.
- Recruitment candidate data (`crm_candidates`, `recruitment_candidates`): CVs/personal data, GDPR-sensitive.
- Call records/recordings metadata (`crm_calls`, `crm_campaigns`), D2D field visit pins.
- Credentials: partner API keys, master ecosystem key, Firebase agent user password, webhook secrets, Twilio/HubSpot credentials entered by users, `crm_api_keys`, `crm_integrations`.
- Tenant separation between organizations and between partner companies.

## Attacker profiles
All of the following matter *(user)*; none is ruled out:
1. Anonymous internet user hitting the API or Firestore directly.
2. Any logged-in / self-registered user of the web app reaching other tenants' data.
3. A partner company with its own API key acting outside its company scope (cross-tenant / cross-partner).
4. Someone who reads the GitHub repo or JS bundle (hardcoded keys and passwords).

## Existing controls (observed)
- Firestore rules: `users/{uid}` writes limited to owner/admin; `vvc_sync_codes` blocks `list`.
- API: CORS preflight handling, payload validation on some endpoints, email dedup on upsert.
- README claims SHA-256 constant-time key verification, scopes and origin allowlists; the current `main` code uses a plaintext key map instead (claim does not match code).

## Out of scope / accepted risk
- Nothing is out of scope *(user)*: dev-only code (Vite plugins, Twilio dev proxy) and seed scripts are ranked like everything else.

## Finding tags
- `Component`: component name from the table above.
- `Firestore collection`: the Firestore collection(s) the finding reads or writes, e.g. `crm_contacts`.
- `OWASP category`: OWASP Top 10 (2021) category, e.g. `A01 Broken Access Control`.
- `GDPR`: `yes` when the finding exposes or alters personal data (contacts, candidates, calls), else `no`.

## Open questions
- Is `crmosone-prod` used anywhere?
- Is the GitHub repository public?
