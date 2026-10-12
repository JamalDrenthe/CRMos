import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import {
  Check,
  X,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

type CompetitorId = 'all' | 'salesdock' | 'leaddesk' | 'recruit-crm';

export function ComparePage() {
  const navigate = useNavigate();
  const [activeCompetitor, setActiveCompetitor] = useState<CompetitorId>('all');

  const competitors = [
    {
      id: 'all',
      name: 'Alles-in-Eén Overzicht',
      badge: 'Volledige Vergelijking',
      headline: 'Waarom 3 losse tools vervangen door CRMos?',
      summary:
        'In plaats van Salesdock voor field sales, LeadDesk voor je belteams en Recruit CRM voor werving, combineert CRMos alle drie in één naadloze workflow.',
    },
    {
      id: 'salesdock',
      name: 'CRMos vs Salesdock',
      badge: 'Field Sales Alternatief',
      headline: 'CRMos versus Salesdock',
      summary:
        'Salesdock richt zich primair op verkoop aan de deur. Maar wat als je diezelfde verkopers ook wilt werven, onboarden en laten nabellen vanuit een callcenter? CRMos verbindt alles.',
    },
    {
      id: 'leaddesk',
      name: 'CRMos vs LeadDesk',
      badge: 'Callcenter Alternatief',
      headline: 'CRMos versus LeadDesk',
      summary:
        'LeadDesk is een krachtige beltool, maar mist integratie met buitendienstverkoop aan de deur en interne recruitment. Met CRMos bellen, bezoeken en werven je teams vanuit één database.',
    },
    {
      id: 'recruit-crm',
      name: 'CRMos vs Recruit CRM',
      badge: 'Recruitment Alternatief',
      headline: 'CRMos versus Recruit CRM',
      summary:
        'Recruit CRM stopt zodra een kandidaat is aangenomen. CRMos trekt de keten door: van kandidaat tot actieve sales agent, campagne-uitvoering en geregistreerde omzet.',
    },
  ];

  const comparisonRows = [
    {
      feature: 'Geïntegreerd CRM & Klantbeheer',
      crmos: true,
      salesdock: true,
      leaddesk: 'Beperkt (alleen contactlijsten)',
      recruitcrm: 'Beperkt (alleen ATS)',
    },
    {
      feature: 'Field Sales & Deur-tot-Deur (Rayonbeheer)',
      crmos: true,
      salesdock: true,
      leaddesk: false,
      recruitcrm: false,
    },
    {
      feature: 'Callcenter Workspace & Belscripts (Pitch Flows)',
      crmos: true,
      salesdock: false,
      leaddesk: true,
      recruitcrm: false,
    },
    {
      feature: 'Recruitment ATS & Kandidaatpijplijnen',
      crmos: true,
      salesdock: false,
      leaddesk: false,
      recruitcrm: true,
    },
    {
      feature: 'Recruitment to Revenue Keten',
      crmos: true,
      salesdock: false,
      leaddesk: false,
      recruitcrm: false,
    },
    {
      feature: 'Gamificatie, Streaks & Team Leaderboards',
      crmos: true,
      salesdock: 'Beperkt',
      leaddesk: 'Beperkt',
      recruitcrm: false,
    },
    {
      feature: 'Realtime Cloud Firestore Synchronisatie',
      crmos: true,
      salesdock: false,
      leaddesk: false,
      recruitcrm: false,
    },
    {
      feature: 'Offerte & Productencatalogus',
      crmos: true,
      salesdock: true,
      leaddesk: false,
      recruitcrm: false,
    },
  ];

  const currentComp = competitors.find((c) => c.id === activeCompetitor) || competitors[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* HERO: COMPARE HEADER */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border/40 bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md mb-6">
              <CRMosLogo size="xs" showText={false} />
              <span>Vergelijk CRMos</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary">Slimmer, Sneller, Samenhangend</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
              Geen drie versnipperde tools.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Eén verbonden platform.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Ontdek waarom toonaangevende commerciële organisaties kiezen voor CRMos in plaats van losse abonnementen
              op Salesdock, LeadDesk en Recruit CRM.
            </p>

            {/* Apple Segmented Competitor Switcher */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto p-1.5 rounded-full bg-muted/60 border border-border/50 backdrop-blur-lg">
              {competitors.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCompetitor(item.id as CompetitorId)}
                  className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    activeCompetitor === item.id
                      ? 'bg-background text-foreground shadow-sm font-semibold scale-100'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* COST COMPARISON CALLOUT */}
        {/* ===================================================================== */}
        <section className="py-12 bg-muted/10 border-b border-border/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-primary/30 bg-card/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Tot 60% kostenbesparing op softwarelicenties</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  3 losse abonnementen (€320+/mnd) vs. CRMos (vanaf €50/mnd)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Naast licentiekosten bespaar je honderden uren op dubbele data-invoer, API-connectors en IT-onderhoud.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/pricing')}
                className="rounded-full px-6 text-sm font-medium shrink-0"
              >
                <span>Bekijk tarieven</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* COMPARISON CONTENT BASED ON SELECTED TAB */}
        {/* ===================================================================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header description */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {currentComp.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {currentComp.headline}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {currentComp.summary}
              </p>
            </div>

            {/* TAB 1: ALL-IN-ONE MATRIX */}
            {activeCompetitor === 'all' && (
              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/60 shadow-xl backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40 text-xs sm:text-sm">
                      <th className="p-4 sm:p-5 font-semibold text-foreground">Functionaliteit / Module</th>
                      <th className="p-4 sm:p-5 font-bold text-primary bg-primary/5">
                        <div className="flex items-center gap-1.5">
                          <CRMosLogo size="xs" showText={false} />
                          <span>CRMos</span>
                        </div>
                      </th>
                      <th className="p-4 sm:p-5 font-semibold text-muted-foreground">Salesdock</th>
                      <th className="p-4 sm:p-5 font-semibold text-muted-foreground">LeadDesk</th>
                      <th className="p-4 sm:p-5 font-semibold text-muted-foreground">Recruit CRM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs sm:text-sm">
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 sm:p-5 font-medium text-foreground">{row.feature}</td>
                        <td className="p-4 sm:p-5 bg-primary/5 font-semibold text-emerald-500">
                          <div className="flex items-center gap-1.5">
                            <Check className="h-4 w-4" />
                            <span>Inclusief</span>
                          </div>
                        </td>
                        <td className="p-4 sm:p-5 text-muted-foreground">
                          {row.salesdock === true ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <Check className="h-4 w-4" /> Ja
                            </span>
                          ) : row.salesdock === false ? (
                            <span className="text-neutral-400 flex items-center gap-1">
                              <X className="h-4 w-4 text-red-400" /> Nee
                            </span>
                          ) : (
                            <span>{row.salesdock}</span>
                          )}
                        </td>
                        <td className="p-4 sm:p-5 text-muted-foreground">
                          {row.leaddesk === true ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <Check className="h-4 w-4" /> Ja
                            </span>
                          ) : row.leaddesk === false ? (
                            <span className="text-neutral-400 flex items-center gap-1">
                              <X className="h-4 w-4 text-red-400" /> Nee
                            </span>
                          ) : (
                            <span>{row.leaddesk}</span>
                          )}
                        </td>
                        <td className="p-4 sm:p-5 text-muted-foreground">
                          {row.recruitcrm === true ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <Check className="h-4 w-4" /> Ja
                            </span>
                          ) : row.recruitcrm === false ? (
                            <span className="text-neutral-400 flex items-center gap-1">
                              <X className="h-4 w-4 text-red-400" /> Nee
                            </span>
                          ) : (
                            <span>{row.recruitcrm}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: CRMOS VS SALESDOCK */}
            {activeCompetitor === 'salesdock' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="p-8 rounded-3xl border border-primary/50 bg-card/80 backdrop-blur-xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <CRMosLogo size="sm" showTagline={false} />
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                      Aanbevolen
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">CRMos Platform</h3>
                  <ul className="space-y-3 text-sm text-foreground/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Volledig field sales en deur-tot-deur rayonbeheer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Inclusief ingebouwd callcenter voor nabellen van niet-thuis leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Inclusief recruitment module om continu nieuwe verkopers aan te trekken</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Geen extra connectors of API-abonnementen nodig</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => navigate('/register')}
                    className="w-full rounded-full py-2.5 text-sm font-medium"
                  >
                    Kies CRMos
                  </Button>
                </div>

                <div className="p-8 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl space-y-6 opacity-90">
                  <h3 className="text-2xl font-bold text-foreground">Salesdock Alleen</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Salesdock is een sterke nichetool voor buitendienstorders, maar heeft serieuze beperkingen voor
                    groeiende organisaties:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen ingebouwd recruitment ATS voor werving van verkopers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen softphone callcenter workspace of dynamische pitch flows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Leads die niet thuis zijn moeten handmatig worden geëxporteerd naar beltools</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: CRMOS VS LEADDESK */}
            {activeCompetitor === 'leaddesk' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="p-8 rounded-3xl border border-primary/50 bg-card/80 backdrop-blur-xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <CRMosLogo size="sm" showTagline={false} />
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                      Aanbevolen
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">CRMos Platform</h3>
                  <ul className="space-y-3 text-sm text-foreground/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Volledig callcenter met dynamische pitch flows &amp; bezwaarafhandeling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Directe koppeling naar buitendienst voor afspraakbevestigingen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Werving en selectie van telemarketeers direct in hetzelfde systeem</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Eenvoudige transparante prijzen zonder verborgen seat-kosten</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => navigate('/register')}
                    className="w-full rounded-full py-2.5 text-sm font-medium"
                  >
                    Kies CRMos
                  </Button>
                </div>

                <div className="p-8 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl space-y-6 opacity-90">
                  <h3 className="text-2xl font-bold text-foreground">LeadDesk Alleen</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    LeadDesk focust strikt op telefonie en dialers, maar mist de totale commerciële samenhang:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen field sales of deur-tot-deur postcode rayonbeheer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen recruitment module of kandidaat-onboarding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Complexe licentiestructuren en hoge instapkosten</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: CRMOS VS RECRUIT CRM */}
            {activeCompetitor === 'recruit-crm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="p-8 rounded-3xl border border-primary/50 bg-card/80 backdrop-blur-xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <CRMosLogo size="sm" showTagline={false} />
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                      Aanbevolen
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">CRMos Platform</h3>
                  <ul className="space-y-3 text-sm text-foreground/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Kandidaatpijplijnen, vacatures en CV-beheer van werving tot plaatsing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Unieke 'Recruitment to Revenue' keten: zet kandidaten direct in op campagnes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Directe prestatiemeting van geplaatste verkopers en agents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Geïntegreerd met verkoopfunnels en callcenter belscripts</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => navigate('/register')}
                    className="w-full rounded-full py-2.5 text-sm font-medium"
                  >
                    Kies CRMos
                  </Button>
                </div>

                <div className="p-8 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl space-y-6 opacity-90">
                  <h3 className="text-2xl font-bold text-foreground">Recruit CRM Alleen</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Recruit CRM is puur een uitzend-/headhuntersbureau tool en mist de operationele commerciële opvolging:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen field sales, deur-tot-deur registraties of rayonkaarten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen actieve callcenteromgeving of belscripts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Geen inzicht in de omzet die geworven personeel realiseert</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRE-FOOTER CALL TO ACTION */}
        {/* ===================================================================== */}
        <section className="border-t border-border/40 bg-muted/10 py-20 text-center px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
              Klaar om te migreren naar het alles-in-één platform?
            </h3>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Test CRMos 14 dagen gratis en ervaar het verschil van één verbonden commerciële werkomgeving.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="rounded-full px-8 text-sm font-medium shadow-md shadow-primary/20"
              >
                <span>Start gratis proefperiode</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/solutions')}
                className="rounded-full px-7 text-sm font-medium"
              >
                <span>Bekijk alle oplossingen</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
