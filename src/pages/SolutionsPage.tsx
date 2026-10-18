import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import {
  MapPin,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Workflow,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export function SolutionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active discipline tab: field-sales | callcenter | recruitment | revenue | automation
  const initialTab = searchParams.get('tab') || 'field-sales';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['field-sales', 'callcenter', 'recruitment', 'revenue', 'automation'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const disciplines = [
    {
      id: 'field-sales',
      title: 'Field Sales & Deur-tot-Deur',
      shortTitle: 'Field Sales',
      subtitle: 'Postcode rayontoewijzing & mobiele orderintake',
      icon: MapPin,
      badge: 'Buitendienst & D2D',
      color: 'from-blue-600 to-indigo-600',
      description:
        'Volledig overzicht over buitendienstteams, rayonverdeling op postcodeniveau, snelle mobiele verkoopflows en directe orderregistratie aan de deur met digitale handtekening.',
      features: [
        {
          name: 'Rayon- & Postcodeverdeling',
          desc: 'Wijs wijken en straten visueel toe aan vertegenwoordigers en voorkom overlap of conflicten.',
        },
        {
          name: 'Mobiele Deur-tot-Deur Verkoopflows',
          desc: 'Overzichtelijke intakeformulieren voor iPad en mobiel met directe digitale handtekening en SEPA-validatie.',
        },
        {
          name: 'Directe Bezoekregistratie',
          desc: 'Leg direct statussen vast zoals "Niet thuis", "Geen interesse" of "Sale gesloten" met GPS-tijdstempels.',
        },
        {
          name: 'Commissies & Prestatierapporten',
          desc: 'Automatische bonusberekening per gesloten deal, team en verkoopcampagne.',
        },
      ],
      advantages:
        'Elk bezoek aan de deur wordt direct vastgelegd. Niet-thuis adressen stromen automatisch door naar het belteam.',
      benefits:
        'Geen administratieve rompslomp aan het eind van de dag. Je weet direct welke straten zijn bezocht en welke deals zijn getekend.',
      searchKeywords: ['Door to door sales software', 'Field sales software', 'Deur tot deur CRM'],
    },
    {
      id: 'callcenter',
      title: 'Callcenter & Telemarketing',
      shortTitle: 'Callcenter',
      subtitle: 'Belcampagnes, interactieve belscripts en agentbeheer',
      icon: PhoneCall,
      badge: 'Contact Center & Bellen',
      color: 'from-emerald-600 to-teal-600',
      description:
        'Campagnebeheer, interactieve belscripts met bezwaarafhandeling, realtime agent-monitoring en directe koppeling naar buitendienstnotities.',
      features: [
        {
          name: 'Campagnes & Belijsten',
          desc: 'Importeer leads, filter op doelgroep en wijs batches automatisch toe aan beschikbare telemarketeers.',
        },
        {
          name: 'Interactieve Belscripts (Pitch Flows)',
          desc: 'Dynamische scripts met doorklik-scenario’s en gerichte bezwaarafhandeling tijdens het telefoongesprek.',
        },
        {
          name: 'Gespreksnotities & Terugbelacties',
          desc: 'Eenvoudige gespreksstatussen, geplande terugbelherinneringen en directe notities bij het contactprofiel.',
        },
        {
          name: 'Prestatie-analytics per Agent',
          desc: 'Volg gespreksduur, bereikratio’s, conversiepercentages en productiviteit per medewerker.',
        },
      ],
      advantages:
        'Telefonische acquisitie en buitendienstcommunicatie delen exact hetzelfde klant- en contactdossier.',
      benefits:
        'Telemarketeers weten exact wat er aan de deur is besproken, wat leidt tot betere gesprekken en een hogere conversie.',
      searchKeywords: ['Callcenter software', 'Telemarketing software', 'Belscript software'],
    },
    {
      id: 'recruitment',
      title: 'Recruitment & Talent Management',
      shortTitle: 'Recruitment ATS',
      subtitle: 'Werving, kandidaatpijplijnen en snelle doorstroom',
      icon: UserCheck,
      badge: 'Werving & Selectie',
      color: 'from-purple-600 to-pink-600',
      description:
        'Kandidaatpijplijnen van eerste sollicitatie tot plaatsing, cv-beheer, vacatures en directe doorstroom naar actieve verkoopteams.',
      features: [
        {
          name: 'Kandidaatpijplijnen & Kanban',
          desc: 'Verplaats kandidaten overzichtelijk door fasen: Sourcing, Screening, Gesprek, Aanbod en Aangenomen.',
        },
        {
          name: 'CV- & Profielbeheer',
          desc: 'Centrale opslag van vaardigheden, gewenst salaris, ervaring en documenten.',
        },
        {
          name: 'Vacatures & Opdrachtgevers',
          desc: 'Koppel vacatures aan opdrachtgevers en match kandidaten op basis van relevante verkoopvaardigheden.',
        },
        {
          name: 'Directe Doorstroom naar Sales',
          desc: 'Zet een aangenomen sollicitant met één klik om naar een actieve account met bel- of rayonrechten.',
        },
      ],
      advantages:
        'Het volledige sollicitatieproces verloopt binnen dezelfde werkomgeving als de dagelijkse salesoperatie.',
      benefits:
        'Nieuw aangenomen vertegenwoordigers en telemarketeers kunnen binnen een uur aan de slag op hun campagne.',
      searchKeywords: ['Recruitment CRM', 'ATS software', 'Personeelswerving CRM'],
    },
    {
      id: 'revenue',
      title: 'Recruitment to Revenue Chain',
      shortTitle: 'Recruitment to Revenue',
      subtitle: 'Van werving tot gerealiseerde verkoopmarge',
      icon: TrendingUp,
      badge: 'Unieke Formule',
      color: 'from-amber-600 to-orange-600',
      description:
        'De directe link tussen personeel en omzet: van sollicitant naar opgeleide agent, actieve campagne-inzet tot getekende contracten en gerealiseerde marge.',
      features: [
        {
          name: 'Kandidaat Activeren als Agent',
          desc: 'Zodra iemand is aangenomen, worden inlogrechten, belprofiel en rayon direct geactiveerd.',
        },
        {
          name: 'Campagnetoewijzing & Targets',
          desc: 'Wijs de agent toe aan een buitendienst- of callcentercampagne met gekoppelde verkoopdoelen.',
        },
        {
          name: 'Prestaties & Gesloten Deals',
          desc: 'Elke gesloten deal wordt direct geregistreerd onder de verkoper en zijn wervingsbron.',
        },
        {
          name: 'Kosten versus Opbrengst',
          desc: 'Zie exact wat een nieuwe medewerker aan werving kostte versus de omzet die hij maandelijks genereert.',
        },
      ],
      advantages:
        'Werving en commerciële uitvoering zijn direct met elkaar verbonden in plaats van twee gescheiden werelden.',
      benefits:
        'Inzicht in welke recruiters of wervingskanalen de meest productieve en winstgevende verkopers aanleveren.',
      searchKeywords: ['Recruitment en sales combineren', 'From People to Performance', 'Commerciële keten software'],
    },
    {
      id: 'automation',
      title: 'Workflows & Automatisering',
      shortTitle: 'Automations',
      subtitle: 'Minder handwerk, snellere opvolging',
      icon: Workflow,
      badge: 'Automatisering',
      color: 'from-cyan-600 to-blue-600',
      description:
        'Geautomatiseerde statusovergangen, taken, herinneringen en directe data-uitwisseling via webhooks en REST API’s.',
      features: [
        {
          name: 'Trigger-gebaseerde Acties',
          desc: 'Stuur automatisch een bevestiging na een positief verkoopgesprek of maak een follow-up taak aan.',
        },
        {
          name: 'Slimme Lead Distributie',
          desc: 'Verdeel binnengekomen leads automatisch op basis van postcodegebied of beschikbaarheid van agents.',
        },
        {
          name: 'Statusovergangen & Notificaties',
          desc: 'Houd teamleiders direct op de hoogte bij grote deals of behaalde weektargets.',
        },
        {
          name: 'Open API & Webhooks',
          desc: 'Koppel eenvoudig met je boekhoudpakket, VOIP-centrale of e-mailsoftware.',
        },
      ],
      advantages:
        'Terugkerende administratieve handelingen worden automatisch uitgevoerd op de achtergrond.',
      benefits:
        'Geen vertraging tussen buitendienst en binnendienst, minder menselijke fouten en meer tijd voor verkopen.',
      searchKeywords: ['Sales automation', 'Lead management software', 'Workflow automation CRM'],
    },
  ];

  const currentDiscipline = disciplines.find((d) => d.id === activeTab) || disciplines[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* HERO: SOLUTIONS HEADER */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border/40 bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[140px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md mb-6">
              <CRMosLogo size="xs" showText={false} />
              <span>Oplossingen &amp; Disciplines</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary">Eén verbonden werkomgeving</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
              Drie disciplines.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Eén verbonden platform.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              CRMos brengt field sales (zoals Salesdock), callcenters (zoals LeadDesk) en recruitment (zoals Recruit CRM)
              samen in één centrale werkomgeving. Van eerste kandidaat tot getekende deal.
            </p>

            {/* Apple Segmented Discipline Switcher */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto p-1.5 rounded-full bg-muted/60 border border-border/50 backdrop-blur-lg">
              {disciplines.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-background text-foreground shadow-sm font-semibold scale-100'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* ACTIVE DISCIPLINE DEEP-DIVE */}
        {/* ===================================================================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Context & FAB */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <currentDiscipline.icon className="h-3.5 w-3.5" />
                    <span>{currentDiscipline.badge}</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
                    {currentDiscipline.title}
                  </h2>
                  <p className="text-sm font-medium text-primary">
                    {currentDiscipline.subtitle}
                  </p>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed pt-2">
                    {currentDiscipline.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {currentDiscipline.features.map((feature, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm space-y-1.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{feature.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                        {feature.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Advantages & Benefits Box */}
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-6 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Wat dit brengt in de praktijk
                    </span>
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {currentDiscipline.advantages}
                    </p>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                      Direct resultaat voor het team
                    </span>
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {currentDiscipline.benefits}
                    </p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="rounded-full px-7 text-sm font-medium gap-2 shadow-md shadow-primary/20"
                  >
                    <span>Start 14 dagen gratis proefperiode</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/compare')}
                    className="rounded-full px-6 text-sm font-medium"
                  >
                    <span>Bekijk vergelijking</span>
                  </Button>
                </div>
              </div>

              {/* Right Column: Interactive Visual Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl border border-border/80 bg-neutral-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[90px] rounded-full pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <currentDiscipline.icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm text-white">Live Workflow Preview</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 font-medium">
                      Actief
                    </span>
                  </div>

                  {activeTab === 'field-sales' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs text-neutral-300">
                          <span className="font-semibold">Rayon: Amsterdam Centrum (1012)</span>
                          <span className="text-emerald-400">92% gedekt</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-neutral-400">Laatste Bezoeken aan de Deur</p>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">Singel 240</p>
                            <p className="text-neutral-400">Vertegenwoordiger: Jamal D.</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                            Sale Gesloten (€140/m)
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">Herengracht 182</p>
                            <p className="text-neutral-400">Vertegenwoordiger: Maria G.</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                            Terugkomen zaterdag
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'callcenter' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">Campagne: Q4 Zakelijk Glasvezel</span>
                          <span className="text-emerald-400 font-bold">14.2% Conversie</span>
                        </div>
                        <p className="text-xs text-neutral-300">
                          32 actieve bellers • 1.480 voltooide calls vandaag
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <span className="text-[11px] font-semibold text-neutral-400">Interactief Belscript</span>
                        <p className="text-xs text-neutral-200 leading-relaxed italic bg-black/40 p-2.5 rounded-lg border border-white/5">
                          "Goedemiddag [Klant], met [Agent] van CRMos. Ik bel u kort naar aanleiding van uw lopende telecomcontract..."
                        </p>
                        <div className="flex gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-neutral-300">Bezwaar: Geen tijd</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-neutral-300">Bezwaar: Te duur</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'recruitment' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">Vacature: Senior Sales Agent D2D</span>
                          <span className="text-purple-300 font-medium">4 open plekken</span>
                        </div>
                        <p className="text-xs text-neutral-300">
                          28 sollicitanten in screening • 6 in interview fase
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">Kandidaat: Alex Johnson</p>
                            <p className="text-neutral-400">Matchscore: 95% • Ervaring: 4 jr</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                            Aanbod Geaccepteerd
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 italic">
                          → Wordt automatisch toegevoegd aan de buitendienst pool met loginrechten.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'revenue' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-white">
                          <span>Recruitment to Revenue Funnel</span>
                          <span className="text-amber-400">ROI 4.8x</span>
                        </div>
                        <p className="text-xs text-neutral-300">
                          10 geworven agents → €145.000 omzet gerealiseerd deze maand
                        </p>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                          <span className="text-neutral-400">1. Sourcing kosten per agent</span>
                          <span className="font-semibold text-white">€350</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                          <span className="text-neutral-400">2. Onboardingstijd tot eerste sale</span>
                          <span className="font-semibold text-emerald-400">3 werkdagen</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                          <span className="text-neutral-400">3. Gemiddelde dealwaarde per agent</span>
                          <span className="font-semibold text-white">€14.500 / mnd</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'automation' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-white">
                          <span>Connected Trigger Flow</span>
                          <span className="text-cyan-300">0.05s uitvoering</span>
                        </div>
                        <p className="text-xs text-neutral-300">
                          Lead getekend aan de deur → Direct SMS naar klant → Facturatie taak aangemaakt.
                        </p>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-neutral-300">Trigger: Deal status = 'Gewonnen'</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-400" />
                          <span className="text-neutral-300">Actie 1: Synchroniseer met Cloud Firestore</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-purple-400" />
                          <span className="text-neutral-300">Actie 2: Ken +150 XP commissie toe aan verkoper</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEO Keyword Badges */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
                      Relevante zoekopdrachten
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentDiscipline.searchKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-white/10 text-neutral-300 text-[10px] px-2.5 py-1"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* WHY THE COMBINATION WORKS: THE VALUE PROPOSITION */}
        {/* ===================================================================== */}
        <section className="border-t border-border/40 bg-muted/20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border/50">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>The Value Proposition</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
                Minder versnippering. Meer samenhang. Betere controle.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Niet simpelweg meer losse software, maar een samenhangende manier om je hele commerciële organisatie
                te laten werken.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                  ✕
                </div>
                <h3 className="text-xl font-bold text-foreground">Het Oude Model: Silo's</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drie losse abonnementen: een wervingstool, een beltool en een sales CRM. Data raakt versnipperd,
                  leads raken kwijt tussen afdelingen en licentiekosten lopen torenhoog op.
                </p>
              </div>

              <div className="p-8 rounded-3xl border border-primary/40 bg-card/80 backdrop-blur-xl space-y-4 relative shadow-xl">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-foreground">Het CRMos Model: Hybride</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Eén centrale operationele omgeving waarin mensen, activiteiten, data en resultaten direct met elkaar
                  verbonden zijn. Van kandidaat tot omzet.
                </p>
                <div className="pt-2 text-xs font-semibold text-primary">
                  100% realtime synchronisatie met Google Cloud Firestore
                </div>
              </div>

              <div className="p-8 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Het Resultaat: Groei</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Minder administratieve overdrachten, snellere onboarding van verkopers en callcenter agents,
                  en direct realtime inzicht in de totale commerciële ROI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* BUILT FOR COMMERCIAL OPERATIONS */}
        {/* ===================================================================== */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Doelgroepen</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ontwikkeld voor commerciële organisaties
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Ontwikkeld voor bedrijven met actieve buitendienstlopers, telefonische acquisitie en continue werving.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Deur-tot-deur organisaties', desc: 'Directe verkoopteams met rayonverdeling' },
              { title: 'Callcenters & Telemarketing', desc: 'Binnendienst met intensieve belcampagnes' },
              { title: 'Recruitmentbureaus', desc: 'Personeelsbemiddelaars en uitzendorganisaties' },
              { title: 'Commerciële dienstverleners', desc: 'B2B advies, consultancy en mediaverkoop' },
              { title: 'Hybride bureaus', desc: 'Organisaties die werving combineren met sales' },
            ].map((audience, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-border/60 bg-card/40 text-center space-y-2 hover:bg-card/70 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-sm text-foreground">{audience.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{audience.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRE-FOOTER CALL TO ACTION */}
        {/* ===================================================================== */}
        <section className="border-t border-border/40 bg-muted/10 py-20 text-center px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ontdek hoe CRMos jouw commerciële operatie verbindt
            </h3>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Start direct met een 14-daagse gratis proefperiode of bekijk onze scherpe alles-in-één tarieven.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="rounded-full px-8 text-sm font-medium shadow-md shadow-primary/20"
              >
                <span>Start 14 dagen gratis</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="rounded-full px-7 text-sm font-medium"
              >
                <span>Bekijk prijzen</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
