import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/stores/languageStore';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import {
  Users,
  Phone,
  Trophy,
  CheckCircle2,
  Star,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'crm' | 'ats' | 'contact' | 'gamification'>('crm');
  const [activeChainStep, setActiveChainStep] = useState<number>(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const testimonials = [
    {
      name: 'Mark van Dijk',
      role: 'Commercieel Directeur',
      company: 'Apex Direct Sales Group',
      content:
        'Voorheen gebruikten we Salesdock voor onze deurlopers en een losse tool voor nabellen. Met CRMos is alles gekoppeld: de buitendienst, het callcenter en zelfs onze recruiter. Onze dealcyclus is met 35% verkort.',
      rating: 5,
    },
    {
      name: 'Laura Hermans',
      role: 'Lead Recruiter & Partner',
      company: 'TalentSource & Commercials',
      content:
        'De "Recruitment to Revenue" flow is goud waard. We werven verkopers en telemarketeers via de ATS module en zien binnen dagen precies hoeveel omzet ze per campagne binnenbrengen. Geen spreadsheets meer.',
      rating: 5,
    },
    {
      name: 'Daan Oosterhout',
      role: 'Operations & Callcenter Manager',
      company: 'ConnectPlus B.V.',
      content:
        'De interactieve Pitch Flows en directe gespreksregistratie hebben onze onboardingstijd voor nieuwe telemarketeers gehalveerd. LeadDesk vervangen door CRMos scheelt ons bovendien duizenden euro’s per jaar.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Wat maakt CRMos uniek vergeleken met traditionele CRM-systemen?',
      answer:
        'CRMos is het enige hybride platform dat drie essentiële commerciële disciplines samenbrengt in één connected workflow: Field Sales (deur-tot-deur en buitendienst), Callcenter & Telemarketing, en Recruitment (ATS). In plaats van 3 losse softwarepakketten heb je één centraal systeem van werving tot omzet.',
    },
    {
      question: 'Hoe snel kan ons team starten met CRMos?',
      answer:
        'Binnen 2 minuten! Registreer een gratis account met je Google account of e-mailadres en je kunt direct beginnen. Er is geen ingewikkelde installatie of maandenlange training vereist. Je kunt bovendien direct voorbeelddata inladen.',
    },
    {
      question: 'Wat is de "Recruitment to Revenue" keten?',
      answer:
        'Dit is de unieke formule van CRMos: je werft een kandidaat via de ingebouwde ATS module, zet deze met één klik om naar een actieve agent, wijst deze toe aan een belcampagne of postcode-rayon, en ziet realtime hoeveel omzet deze persoon realiseert.',
    },
    {
      question: 'Kan CRMos bestaande tools zoals Salesdock, LeadDesk of Recruit CRM vervangen?',
      answer:
        'Ja, CRMos is specifiek ontworpen om deze losse tools te consolideren. Zo bespaar je tot wel 60% op softwarekosten en voorkom je dataversnippering en handmatige import/export koppelingen.',
    },
    {
      question: 'Is er een gratis proefperiode en zijn er verplichtingen?',
      answer:
        'Jazeker! Je kunt 14 dagen lang gratis en vrijblijvend gebruikmaken van alle functionaliteiten van het platform. Geen creditcard vereist en je zit nergens aan vast.',
    },
  ];

  const pillars = [
    {
      number: '01',
      title: 'Unified CRM',
      subtitle: 'Centraal beheer van relaties en operatie',
      desc: 'Centraal beheer van leads, klanten, kandidaten, medewerkers, opdrachtgevers, teams en volledige contactgeschiedenis.',
      advantage: 'Alle relevante informatie is logisch verbonden en toegankelijk vanuit één systeem op basis van gebruikersrechten.',
      benefit: 'Minder dubbel werk, minder versnipperde gegevens en compleet overzicht over relaties en activiteiten.',
    },
    {
      number: '02',
      title: 'Field Sales Management',
      subtitle: 'Geïnspireerd door de kracht van Salesdock',
      desc: 'Leadverdeling, campagnebeheer, bezoekregistratie, verkoopflows, taakbeheer en prestatierapportages voor deur tot deur en buitendienst.',
      advantage: 'Verkoopactiviteiten kunnen worden georganiseerd en gevolgd vanaf de eerste lead tot de geregistreerde verkoop.',
      benefit: 'Meer grip op dagelijkse activiteiten, betere opvolging en duidelijker inzicht in commerciële prestaties.',
    },
    {
      number: '03',
      title: 'Callcenter Operations',
      subtitle: 'Geïnspireerd door het beste van LeadDesk',
      desc: 'Campagnebeheer, contactlijsten, gespreksregistratie, terugbelacties, agenttoewijzing en dynamische belscripts.',
      advantage: 'Telefonische activiteiten en commerciële opvolging worden binnen dezelfde klantcontext georganiseerd.',
      benefit: 'Efficiëntere werkprocessen, betere contacthistorie en meer inzicht in prestaties van agents en campagnes.',
    },
    {
      number: '04',
      title: 'Recruitment & Talent Management',
      subtitle: 'Geïnspireerd door het beste van Recruit CRM',
      desc: 'Kandidaatprofielen, CV-beheer, vacatures, kandidaatpijplijnen, opdrachtgeversbeheer, matching en plaatsingsregistratie.',
      advantage: 'Het volledige recruitmentproces kan vanuit één omgeving worden beheerd, van sourcing tot plaatsing.',
      benefit: 'Minder administratieve rompslomp, betere opvolging van talent en meer grip op personeelscapaciteit.',
    },
    {
      number: '05',
      title: 'Connected Workflows',
      subtitle: 'Geautomatiseerde samenhang tussen processen',
      desc: 'Automatische acties, trigger-gebaseerde statusovergangen, herinneringen en integraties tussen afdelingen.',
      advantage: 'Terugkerende werkzaamheden worden automatisch uitgevoerd wanneer aan vooraf bepaalde voorwaarden is voldaan.',
      benefit: 'Minder handmatige overdrachten, snellere processen en meer tijd voor activiteiten die waarde opleveren.',
    },
    {
      number: '06',
      title: 'Recruitment to Revenue',
      subtitle: 'Van kandidaat tot gerealiseerde omzet',
      desc: 'Directe verbinding tussen kandidaten, onboarding, medewerkers, salescampagnes en commerciële resultaten.',
      advantage: 'Personeelswerving en commerciële uitvoering kunnen als onderdelen van dezelfde operationele keten worden beheerd.',
      benefit: 'Organisaties krijgen direct inzicht in de relatie tussen personeelscapaciteit, inzetbaarheid en omzetresultaten.',
    },
    {
      number: '07',
      title: 'Performance Analytics',
      subtitle: 'Data-gedreven besluitvorming',
      desc: 'Rapportages over leads, conversies, contactactiviteiten, agentprestaties, recruitmentfunnels en plaatsingen.',
      advantage: 'Gegevens uit verschillende disciplines worden gecombineerd om prestaties en knelpunten te analyseren.',
      benefit: 'Beter onderbouwde beslissingen, gerichtere coaching en direct zicht op verbetermogelijkheden.',
    },
    {
      number: '08',
      title: 'Flexible Integrations',
      subtitle: 'Koppelingen met je ecosysteem',
      desc: 'Koppelingen met externe systemen via API’s, webhooks, Google Cloud Firestore en moderne integraties.',
      advantage: 'CRMos werkt naadloos samen met bestaande telefonie, communicatie en administratieve software.',
      benefit: 'Een flexibele softwareomgeving die meegroeit met de organisatie en dure systeemvervanging voorkomt.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Apple-style Frosted Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* APPLE CINEMATIC HERO SECTION: THE 3 DISCIPLINES */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          {/* Apple ambient illumination glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[450px] h-[320px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Apple Eyebrow Pill with Animated Logo */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground backdrop-blur-md shadow-sm mb-8 hover:bg-muted/70 transition-all group">
              <CRMosLogo size="xs" showText={false} />
              <span className="font-semibold text-foreground">CRMos 2.0</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-foreground">One Platform. Three Disciplines. One Connected Workflow.</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            {/* Apple Hero Title */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[-0.035em] text-foreground max-w-5xl mx-auto leading-[1.04]">
              From People{' '}
              <span className="block mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                to Performance.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg sm:text-2xl text-muted-foreground font-normal tracking-tight max-w-3xl mx-auto leading-relaxed text-balance">
              CRMos is de hybride CRM oplossing die <span className="text-foreground font-semibold">sales</span>,{' '}
              <span className="text-foreground font-semibold">callcenters</span> en{' '}
              <span className="text-foreground font-semibold">recruitment</span> samenbrengt in één centraal platform.
            </p>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Geïnspireerd door de kracht van Salesdock, LeadDesk en Recruit CRM verbindt CRMos commerciële processen,
              klantcontact en personeelswerving. Van vacature en kandidaat tot campagne en deal.
            </p>

            {/* Apple Action CTA Row */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto h-12 rounded-full px-8 text-sm font-medium shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-1.5"
              >
                <span>{t('Start 14-Day Free Trial')}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/solutions')}
                className="w-full sm:w-auto h-12 rounded-full px-6 text-sm font-medium hover:bg-muted transition-all gap-1"
              >
                <span>Ontdek Oplossingen</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate('/compare')}
                className="w-full sm:w-auto h-12 rounded-full px-5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all group gap-1"
              >
                <span>Vergelijk met Salesdock &amp; LeadDesk</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>

            {/* Apple Trust Micro-badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Geen creditcard vereist</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Live binnen 2 minuten</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Google Cloud Firestore Realtime Sync</span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3 DISCIPLINES QUICK PILLARS BANNER */}
            {/* ===================================================================== */}
            <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div
                onClick={() => navigate('/solutions?tab=field-sales')}
                className="p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                    Salesdock kracht <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground">Field Sales &amp; D2D</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Leadverdeling, postcode rayonkaarten, buitendienstregistratie en verkoopflows aan de deur.
                </p>
              </div>

              <div
                onClick={() => navigate('/solutions?tab=callcenter')}
                className="p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                    LeadDesk kracht <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground">Callcenter Operations</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Campagnes, interactieve belscripts (Pitch Flows), terugbelacties en realtime gespreksmonitoring.
                </p>
              </div>

              <div
                onClick={() => navigate('/solutions?tab=recruitment')}
                className="p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                    Recruit CRM kracht <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground">Recruitment &amp; ATS</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kandidaatpijplijnen, CV-beheer, vacatures en naadloze onboarding naar actieve verkoopteams.
                </p>
              </div>
            </div>

            {/* ================================================================= */}
            {/* HARDWARE STUDIO DISPLAY SHOWCASE */}
            {/* ===================================================================== */}
            <div className="mt-16 mx-auto max-w-6xl">
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-4 bg-neutral-900 border border-neutral-700/60 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                {/* macOS Window Titlebar */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 mb-3 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
                    <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1 text-[11px] font-mono text-neutral-300">
                    <CRMosLogo size="xs" showText={false} />
                    <span>CRMos v2.4 • Operating System for Growth</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">Firestore Connected</span>
                  </div>
                </div>

                {/* Showcase Tab Selector */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('crm')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      activeTab === 'crm'
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{t('Sales CRM & Pipelines')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ats')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      activeTab === 'ats'
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Recruitment &amp; ATS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      activeTab === 'contact'
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Contact Center &amp; Scripts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gamification')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      activeTab === 'gamification'
                        ? 'bg-white text-black shadow-sm font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Gamification &amp; Rayons</span>
                  </button>
                </div>

                {/* Tab 1: Sales CRM Preview */}
                {activeTab === 'crm' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div>
                        <h4 className="font-semibold text-lg text-white">Sales Pipeline &amp; Field Deals</h4>
                        <p className="text-xs text-neutral-400">Totale pijplijnwaarde: €358.000 • 5 actieve deals</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 font-medium">
                        Live Firestore Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Lead Buitendienst</span>
                          <span className="text-neutral-500">1</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">StartupXYZ - Pilot</p>
                          <p className="text-xs text-neutral-400 mt-0.5">€12.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Rayon: Amsterdam Oost</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Gekwalificeerd</span>
                          <span className="text-neutral-500">1</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">Global Solutions B.V.</p>
                          <p className="text-xs font-semibold text-blue-400 mt-0.5">€85.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Beller: Jamal Drenthe</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Offerte / Pitch</span>
                          <span className="text-neutral-500">2</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">Enterprise Expansion</p>
                          <p className="text-xs font-semibold text-purple-400 mt-0.5">€145.000</p>
                          <div className="mt-2 text-[10px] text-emerald-400">Offerte verstuurd</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Gewonnen / Getekend</span>
                          <span className="text-emerald-400">1</span>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-sm">
                          <p className="text-sm font-medium text-emerald-300">TechFlow - Jaarlicentie</p>
                          <p className="text-xs font-bold text-white mt-0.5">€48.000</p>
                          <div className="mt-2 text-[10px] text-emerald-400">Deur-tot-deur sale gesloten</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: ATS Recruitment Preview */}
                {activeTab === 'ats' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div>
                        <h4 className="font-semibold text-lg text-white">Talent Pipeline &amp; Kandidaat Matching</h4>
                        <p className="text-xs text-neutral-400">4 actieve vacatures • 24 gescreende kandidaten</p>
                      </div>
                      <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-3 py-1 font-medium">
                        Geïntegreerd met Sales Teams
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-400">Interview Ronde 2</span>
                          <span className="text-[10px] text-neutral-400">Match 94%</span>
                        </div>
                        <p className="font-medium text-sm text-white">Alice Williams</p>
                        <p className="text-xs text-neutral-400">Buitendienst Account Manager</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-300">D2D Verkoop</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-300">Rijbewijs B</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400">Aanbod Fase</span>
                          <span className="text-[10px] text-neutral-400">Match 98%</span>
                        </div>
                        <p className="font-medium text-sm text-white">David Brown</p>
                        <p className="text-xs text-neutral-400">Callcenter Teamlead</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-300">Telemarketing</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-300">Outbound</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-300">Onboarding naar Sales</span>
                          <span className="text-[10px] text-emerald-400">Direct Actief</span>
                        </div>
                        <p className="font-medium text-sm text-white">Jennifer Lee</p>
                        <p className="text-xs text-neutral-300">Toegekend aan Rayon: Rotterdam</p>
                        <p className="text-[11px] text-neutral-400 pt-1">
                          → Klaar om leads aan de deur op te volgen
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Contact Center Preview */}
                {activeTab === 'contact' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <h4 className="font-semibold text-lg text-white">Live Call Workspace &amp; Pitch Flow</h4>
                          <p className="text-xs text-neutral-400">Outbound Belcampagne: +31 20 894 1200 • Duur: 03:42</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 font-medium">
                        Gesprek Actief
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-300">Dynamische Pitch Flow</span>
                          <span className="text-[11px] text-neutral-500">Stap 2 van 4: Behoefteanalyse</span>
                        </div>
                        <p className="text-sm text-neutral-200 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                          "Geweldig om te horen! Waar ervaren jullie momenteel de grootste vertraging in jullie opvolging van leads?"
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button type="button" className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                            Optie A: Te trage opvolging
                          </button>
                          <button type="button" className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                            Optie B: Losse systemen
                          </button>
                          <button type="button" className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                            Optie C: Hoge softwarekosten
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-3">
                        <span className="text-xs font-semibold text-neutral-300">Gespreksstatistieken</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-neutral-400">
                            <span>Sentiment</span>
                            <span className="text-emerald-400 font-semibold">94% Positief</span>
                          </div>
                          <div className="flex justify-between text-neutral-400">
                            <span>Campagne</span>
                            <span className="text-white">Q4 B2B Acquisitie</span>
                          </div>
                          <div className="flex justify-between text-neutral-400">
                            <span>Agent</span>
                            <span className="text-white">Jamal Drenthe</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Gamification & Rayons */}
                {activeTab === 'gamification' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div>
                        <h4 className="font-semibold text-lg text-white">Team Leaderboard &amp; Rayon Prestaties</h4>
                        <p className="text-xs text-neutral-400">Maandelijkse Sales Competitie • Streaks, Commissies &amp; XP</p>
                      </div>
                      <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 font-medium">
                        Level 15 Sales Legend
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-bold text-xs shadow-sm">
                            #1
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-white">Maria Garcia</p>
                            <p className="text-xs text-neutral-400">24 Deals Gesloten • D2D Rayon Utrecht</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-amber-400">15.800 Pts • €3.450 Commissie</span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-neutral-900">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-neutral-300 font-bold text-xs">
                            #2
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-white">Alex Johnson</p>
                            <p className="text-xs text-neutral-400">18 Deals Gesloten • Callcenter Binnendienst</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-blue-400">12.500 Pts</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* THE PROBLEM: VERSNIPPERING VS. SAMENHANG */}
        {/* ===================================================================== */}
        <section className="border-t border-border/40 bg-muted/20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                  Het Probleem
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Drie losse tools.{' '}
                  <span className="text-muted-foreground block font-normal">
                    Drie keer zoveel complexiteit.
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed pt-2">
                  Salesorganisaties, callcenters en recruitmentbureaus werken vaak met verschillende systemen voor
                  klantbeheer, telefonie, verkoopregistratie en personeelswerving.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Daardoor raken gegevens versnipperd, ontstaan dubbele administratieve werkzaamheden en kost het
                  moeite om inzicht te krijgen in de volledige bedrijfsvoering.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md space-y-2">
                  <div className="text-red-500 font-bold text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Versnipperde Klantdata
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Wat aan de deur wordt besproken is onbekend bij het belteam, en wervingsdata staat in een geïsoleerde ATS silo.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md space-y-2">
                  <div className="text-red-500 font-bold text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Dubbele Invoer &amp; Fouten
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Urenlang handmatig knippen en plakken tussen spreadsheets, belsoftware en offertetools.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md space-y-2">
                  <div className="text-red-500 font-bold text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Geen Keten-Inzicht
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Onmogelijk om te meten wat een geworven verkoper kost versus wat hij daadwerkelijk oplevert aan omzet.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 backdrop-blur-md space-y-2">
                  <div className="text-emerald-500 font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    De CRMos Oplossing
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    Minder versnippering. Meer samenhang. Betere controle. Eén verbonden systeem voor je hele commerciële organisatie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* INTERACTIVE WORKFLOW: RECRUITMENT TO REVENUE CHAIN */}
        {/* ===================================================================== */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>The Connected Workflow</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
                Recruitment to Revenue Chain
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Van kandidaat tot omzet. Bekijk hoe personeelswerving en commerciële uitvoering naadloos samenkomen
                in één operationele keten.
              </p>
            </div>

            {/* Chain Step Switcher Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {[
                { step: 1, label: '1. Kandidaat Werven' },
                { step: 2, label: '2. Onboarding als Agent' },
                { step: 3, label: '3. Campagne & Rayon' },
                { step: 4, label: '4. Buitendienst & Bellen' },
                { step: 5, label: '5. Deal & Omzet' },
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveChainStep(item.step)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    activeChainStep === item.step
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chain Content Card */}
            <div className="rounded-3xl border border-border/70 bg-card/60 p-8 sm:p-12 backdrop-blur-xl shadow-xl max-w-4xl mx-auto">
              {activeChainStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400">
                    Stap 1 • Recruitment &amp; ATS
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Kandidaat Werven &amp; Matchen
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Je plaatst een vacature voor sales professionals of telemarketeers. Sollicitanten komen binnen via vacaturesites of directe sourcing. Het CV wordt geanalyseerd en gekoppeld aan de kandidaatpijplijn.
                  </p>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                    ★ Resultaat: Geschikte kandidaat aangenomen zonder losse softwarelicentie voor Recruit CRM.
                  </div>
                </div>
              )}

              {activeChainStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400">
                    Stap 2 • Automatische Onboarding
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Directe Omzetting naar Actieve Medewerker
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Met één klik zet je de aangenomen kandidaat om naar een volwaardig teamlid. Loginrechten, telefoonextensie en verkoopdoelstellingen worden geactiveerd binnen exact hetzelfde platform.
                  </p>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                    ★ Resultaat: Geen handmatige accountaanmaak of synchronisatiefouten tussen HR en Sales.
                  </div>
                </div>
              )}

              {activeChainStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                    Stap 3 • Campagne- &amp; Rayontoewijzing
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Toewijzing aan Belcampagne of Buitendienst Rayon
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    De agent krijgt direct toegang tot zijn aangewezen postcodes voor deur-tot-deur verkoop of wordt gekoppeld aan de outbound callcentercampagne met het bijbehorende interactieve belscript (Pitch Flow).
                  </p>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                    ★ Resultaat: Verkopers kunnen binnen 1 uur na onboarding productief aan de slag.
                  </div>
                </div>
              )}

              {activeChainStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400">
                    Stap 4 • Buitendienst &amp; Callcenter Uitvoering
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Klantinteractie &amp; Live Registratie
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Aan de deur registreert de verkoper direct de order met digitale handtekening. Was de prospect niet thuis? Dan verschijnt het adres direct in de terugbellijst van het callcenter om telefonisch te worden opgevolgd.
                  </p>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                    ★ Resultaat: Geen enkele lead verdwijnt meer in de vergetelheid.
                  </div>
                </div>
              )}

              {activeChainStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                    Stap 5 • Realtime Omzet &amp; Commissie
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Geregistreerde Omzet &amp; Prestatiebeloning
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    De deal wordt geregistreerd in de centrale pipeline, de omzet telt mee voor de organisatie en de verkoper ontvangt automatisch gamificatie XP en provisie. Het management ziet direct de winstgevendheid per werknemer.
                  </p>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-emerald-400 font-medium">
                    ★ Resultaat: From People to Performance. Volledig inzicht in de commerciële ROI.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 8 PILLARS: FEATURES, ADVANTAGES & BENEFITS */}
        {/* ===================================================================== */}
        <section id="features" className="border-t border-border/40 bg-muted/10 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Pijlers &amp; Voordelen</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
                Acht krachtige pijlers. Ongekend rendement.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Elke module van CRMos is ontworpen om zowel operationele voordelen (Advantages) als direct meetbaar
                rendement (Benefits) te leveren.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pillars.map((pillar) => (
                <div
                  key={pillar.number}
                  className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-lg space-y-4"
                >
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-primary">
                      {pillar.number}
                    </span>
                    <h3 className="text-xl font-bold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-xs font-medium text-primary/90">
                      {pillar.subtitle}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-3 space-y-2 text-[11px]">
                    <div>
                      <span className="font-bold text-foreground">Voordeel:</span>{' '}
                      <span className="text-muted-foreground">{pillar.advantage}</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-500">Rendement:</span>{' '}
                      <span className="text-foreground/90 font-medium">{pillar.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* APPLE METRICS BAR */}
        {/* ===================================================================== */}
        <section className="border-y border-border/40 bg-muted/20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">+48%</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Hogere dealconversie</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">3.5x</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Snellere onboarding van agents</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-500">24/7</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Google Cloud Firestore Sync</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">&lt; 60%</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Lagere softwarelicentiekosten</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* APPLE TESTIMONIALS SECTION */}
        {/* ===================================================================== */}
        <section className="border-t border-border/40 bg-muted/10 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
                {t('Customer Experiences')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
                Vertrouwd door toonaangevende commerciële teams.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-border/60 bg-card/70 p-8 backdrop-blur-xl shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      "{item.content}"
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/40">
                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.role} • {item.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRICING PREVIEW BANNER */}
        {/* ===================================================================== */}
        <section className="py-20 border-t border-border/40 bg-muted/20 text-center">
          <div className="mx-auto max-w-4xl px-4 space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Transparante Prijzen
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Geen verborgen seat-kosten. Eerlijk en schaalbaar.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Starter voor €200/mnd, Professional voor €100/mnd en Enterprise voor €50/mnd.
              Inclusief alle functionaliteiten van sales, callcenter en recruitment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/pricing')}
                className="rounded-full px-8 text-sm font-medium shadow-md shadow-primary/20"
              >
                <span>Bekijk Prijzen &amp; Pakketten</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/compare')}
                className="rounded-full px-6 text-sm font-medium"
              >
                <span>Vergelijk met alternatieven</span>
              </Button>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* APPLE INTERACTIVE FAQ SECTION */}
        {/* ===================================================================== */}
        <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
              {t('Frequently Asked Questions')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Vragen en antwoorden.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-base text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200 border-t border-border/30 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Apple Structured Footer */}
      <Footer />
    </div>
  );
}
