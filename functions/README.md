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
`custom_fields`. Nieuwe contacten krijgen een deterministisch document-ID op
basis van het e-mailadres, of van `tag:` plus `vvc_tag` als er geen e-mailadres
is. Bestaande velden worden alleen ingevuld wanneer ze ontbreken of leeg zijn;
tags worden samengevoegd en bestaande `custom_fields`-sleutels blijven leidend.
Als het e-mailadres en `vvc_tag` naar verschillende contacten verwijzen,
retourneert de API `409`.

Deals en activiteiten worden opgeslagen in `crm_deals` en `crm_activities`.
Deals accepteren de fasen `lead`, `qualified`, `proposal`, `negotiation`,
`closed-won` en `closed-lost`. Activiteiten accepteren de typen `call`,
`email`, `meeting`, `task`, `note`, `whatsapp` en `sms` (standaard `note`) en
bevatten de CRMos-relatie in `related_to`. JSON-requestbody's zijn maximaal
64 KiB; de limiet wordt ook toegepast op gestreamde requests.

Configureer op Cloudflare Pages (production én preview) de variabelen
`CRMOS_SERVICE_EMAIL`, `CRMOS_SERVICE_PASSWORD`, `CRMOS_API_KEYS`,
`VITE_FIREBASE_API_KEY` en `VITE_FIREBASE_PROJECT_ID`. `CRMOS_API_KEYS` is een
JSON-array met per sleutel `id`, SHA-256-hash `sha256`, `scopes` en `origins`.
Voor lokale ontwikkeling gebruikt Wrangler `.dev.vars`; deze bevat geheimen
en hoort niet in versiebeheer.
