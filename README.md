# CRMos

CRMos is een uitgebreide CRM- en recruitmentapplicatie voor sales- en
contactcenterteams. De interface combineert relatiebeheer, dealpijplijnen,
werving en operationele dashboards in één applicatie.

## Functionaliteiten

- Dashboard met verkoop-, recruitment-, contactcenter- en prestatie-indicatoren.
- CRM voor contacten, bedrijven, deals, activiteiten en pijplijnen.
- Recruitmentmodule voor kandidaten, vacatures en sollicitatieprocessen.
- Salesfuncties voor producten en offertes.
- Contactcenter met agent workspace, campagnes en pitch flows.
- 360°-contactweergave met tijdlijn, deals, activiteiten en communicatie.
- Dashboard Builder voor aanpasbare widgets en dashboards.
- Gamification, leaderboard en prestatieoverzichten.
- Territory management en workflowautomatisering.
- Globale zoekfunctie voor contacten, kandidaten, vacatures en deals.
- Instellingen en auditlogs voor beheer.

De huidige applicatie gebruikt lokale stores en voorbeelddata in de frontend.
Er is nog geen backend- of databasekoppeling opgenomen.

## Tech stack

- React 19 en TypeScript
- Vite 7
- React Router
- Zustand voor lokale state
- Tailwind CSS en Radix UI
- Recharts voor datavisualisatie
- React Hook Form en Zod voor formulieren en validatie
- Lucide React voor iconen
- ESLint voor kwaliteitscontrole

## Lokaal starten

Vereisten:

- Node.js 20 of nieuwer
- npm

Installeer de dependencies en start de ontwikkelserver:

```bash
npm install
npm run dev
```

Open vervolgens de URL die Vite in de terminal toont. Voor een productiebuild:

```bash
npm run build
npm run preview
```

## Scripts

| Script | Beschrijving |
| --- | --- |
| `npm run dev` | Start de Vite-ontwikkelserver met hot reload. |
| `npm run build` | Controleert TypeScript en maakt een productiebuild. |
| `npm run lint` | Voert ESLint uit over het project. |
| `npm run preview` | Serveert de productiebuild lokaal. |

## Projectstructuur

```text
.
├── src/
│   ├── components/       Herbruikbare layout-, zoek- en UI-componenten
│   ├── pages/            Dashboard-, CRM-, sales-, recruitment- en beheerpagina's
│   ├── stores/           Zustand-stores voor applicatie- en domeinstate
│   ├── types/            TypeScript-modellen voor CRM en aanvullende modules
│   ├── hooks/            Herbruikbare React-hooks
│   ├── lib/              Algemene hulpfuncties
│   ├── App.tsx           Router en beschermde applicatielayout
│   └── main.tsx          Frontend-entrypoint
├── public/               Statische bestanden, indien aanwezig
├── index.html             HTML-entrypoint
├── package.json           Dependencies en npm-scripts
├── tailwind.config.js     Tailwind-configuratie
├── vite.config.ts         Vite-configuratie
└── tsconfig*.json         TypeScript-configuratie
```

## Licentie

Er is momenteel geen aparte licentie in deze repository opgenomen.
