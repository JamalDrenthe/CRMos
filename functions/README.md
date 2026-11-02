# CRMos Pages API

De Cloudflare Pages Function biedt de volgende routes:

| Methode en route | Vereiste scope |
| --- | --- |
| `GET /api/v1/health` | Geen |
| `POST /api/v1/contacts/upsert` | `contacts:upsert` |
| `GET /api/v1/contacts?email=...` | `contacts:read` |
| `POST /api/v1/deals` | `deals:create` |
| `POST /api/v1/activities` | `activities:create` |

Stuur een API-key als `Authorization: Bearer <key>` of via `x-api-key`.
Responses zijn JSON met `success` en `data` of `message`. Contact-upserts
bewaren de CRM-velden in `crm_contacts`; `custom` wordt opgeslagen als
`custom_fields`. Deals en activiteiten worden opgeslagen in `crm_deals` en
`crm_activities`.

Configureer op Cloudflare Pages (production én preview) de variabelen
`CRMOS_SERVICE_EMAIL`, `CRMOS_SERVICE_PASSWORD`, `CRMOS_API_KEYS`,
`VITE_FIREBASE_API_KEY` en `VITE_FIREBASE_PROJECT_ID`. `CRMOS_API_KEYS` is een
JSON-array met per sleutel `id`, SHA-256-hash `sha256`, `scopes` en `origins`.
Voor lokale ontwikkeling gebruikt Wrangler `.dev.vars`; deze bevat geheimen
en hoort niet in versiebeheer.
