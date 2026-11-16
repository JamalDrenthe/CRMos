# Beveiligingsbeleid

## Een kwetsbaarheid melden

Heb je een beveiligingsprobleem gevonden in CRMos? Meld dit zo snel mogelijk via
[security@crmos.one](mailto:security@crmos.one) of via een privémelding aan
[@JamalDrenthe](https://github.com/JamalDrenthe) op GitHub.

Publiceer de details van een kwetsbaarheid niet in een openbaar issue voordat het
probleem is verholpen.

## Wat je mag verwachten

- **Binnen 48 uur** een eerste reactie op je melding.
- **Binnen 7 dagen** een beoordeling van de ernst en een plan van aanpak.
- Kritieke kwetsbaarheden worden met prioriteit opgelost; je wordt op de hoogte
  gehouden van de voortgang.
- Na afronding publiceren we, in overleg met jou, de details (coordinated
  disclosure). Vermelding van jou als melder kan op verzoek.

## Scope

De volgende onderdelen vallen onder dit beleid:

- De webapplicatie (`src/`) en de Cloudflare Pages Functions API (`functions/`, `src/server/`)
- Firestore Security Rules (`firestore.rules`) en de multi-tenant isolatie
- De CRMos REST API (`/api/v1/*`) en de API-key-authenticatie
- Outbound webhooks en integraties (bijvoorbeeld Twilio, VVC-koppelingen)

## Buiten scope

- Kwetsbaarheden in diensten van derden (Firebase, Cloudflare, Twilio); meld deze
  rechtstreeks bij de betreffende leverancier.
- Voorbehouden configuratie van gebruikers (bijvoorbeeld een te ruime Firebase
  API-key zonder referrer-restricties valt onder platformconfiguratie, niet onder
  code).

## Aanbevolen controles bij een melding

- Een reproduceerbare beschrijving of proof of concept.
- De getroffen route, collectie of component.
- De mogelijke impact op gegevens van andere tenants.

## Best practices voor bijdragers

- Commit nooit credentials, API-keys of `.env`-bestanden.
- Nieuwe Firestore-collecties vereisen expliciete rules met `org_id`-isolatie.
- Nieuwe API-routes vereisen authenticatie via `crmosApiCore` (geen publieke
  endpoints zonder API-key).
