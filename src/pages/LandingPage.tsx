import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/stores/languageStore';
import {
  Briefcase,
  Users,
  Phone,
  Target,
  Trophy,
  Workflow,
  ArrowRight,
  CheckCircle2,
  Star,
  ChevronRight,
  Check,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'crm' | 'ats' | 'contact' | 'gamification'>('crm');

  const testimonials = [
    {
      name: 'Mark van Dijk',
      role: 'Sales Director',
      company: 'Apex Media Groep',
      content:
        'Sinds we CRMos gebruiken, is de doorlooptijd van onze dealcyclus met 35% gedaald. De naadloze combinatie van de pijplijn met belscripts maakt onze binnendienst twee keer zo productief.',
      rating: 5,
    },
    {
      name: 'Laura Hermans',
      role: 'Lead Tech Recruiter',
      company: 'TalentSource NL',
      content:
        'Eindelijk één tool waarin onze kandidaten en klantdeals hand in hand gaan. Geen gedoe meer met synchronisatie tussen twee verschillende platforms. Een absolute verademing.',
      rating: 5,
    },
    {
      name: 'Daan Oosterhout',
      role: 'Operations & Callcenter Manager',
      company: 'ConnectPlus B.V.',
      content:
        'De interactieve Pitch Flows en directe gespreksregistratie hebben onze onboardingstijd voor nieuwe telemarketeers gehalveerd. En de gamificatie houdt het hele team gemotiveerd!',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: t('How quickly can our team get started with CRMos?'),
      answer:
        'Binnen 2 minuten! Registreer een gratis account met je Google account of e-mailadres en je kunt direct beginnen. Er is geen ingewikkelde installatie of training vereist.',
    },
    {
      question: t('Can I use CRMos with my existing Google / Firebase project?'),
      answer:
        'Ja, CRMos is gebouwd om direct te koppelen met Google Cloud Firestore. Al je data kan realtime worden gesynchroniseerd met je eigen Firebase project ID.',
    },
    {
      question: t('Is there a free trial period?'),
      answer:
        'Jazeker! Je kunt 14 dagen lang gratis en vrijblijvend gebruikmaken van alle functionaliteiten van het Professional plan. Geen creditcard vereist.',
    },
    {
      question: t('Can we manage multiple departments and roles?'),
      answer:
        'Absoluut. CRMos biedt fijnmazig rechtenbeheer voor Admins, Managers, Recruiters en Contactcenter Agents, inclusief territorium- en rayonbeheer.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Glassmorphic Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* HERO SECTION */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
          {/* Subtle background glow effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs sm:text-sm font-medium text-foreground backdrop-blur-md shadow-sm mb-8 hover:bg-muted transition-colors">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-primary">CRMos Cloud</span>
              <span className="text-muted-foreground">•</span>
              <span>{t('Realtime Firestore Sync & Google Sign-In')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.12]">
              {t('The Operating System for')}{' '}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sales, Recruitment
              </span>{' '}
              {t('& Contact Centers')}
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('Manage leads, accelerate deals, hire top talent and empower phone agents. An all-in-one platform with realtime pipeline sync, dynamic pitch flows and team gamification.')}
            </p>

            {/* Main CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2"
              >
                <span>{t('Start 14-Day Free Trial')}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto h-12 px-8 text-base font-medium border-border/80 hover:bg-accent transition-all"
              >
                {t('View Pricing & Plans')}
              </Button>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{t('No credit card required')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{t('Live within 2 minutes')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{t('GDPR-proof & Secure')}</span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* INTERACTIVE PRODUCT SHOWCASE */}
            {/* ================================================================= */}
            <div className="mt-16 mx-auto max-w-6xl rounded-2xl border bg-card/80 p-2 sm:p-4 shadow-2xl backdrop-blur-md">
              {/* Showcase switcher buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 border-b pb-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('crm')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'crm'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>{t('Sales CRM & Pipelines')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ats')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'ats'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>{t('Recruitment & ATS')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'contact'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span>{t('Contact Center Workspace')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gamification')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'gamification'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span>{t('Gamification & 360°')}</span>
                </button>
              </div>

              {/* Tab 1: CRM Preview */}
              {activeTab === 'crm' && (
                <div className="rounded-xl bg-background border p-4 sm:p-6 text-left animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{t('Sales Pipeline Overview')}</h4>
                      <p className="text-xs text-muted-foreground">Totale pijplijnwaarde: €358.000 • 5 actieve deals</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Live Firestore Sync
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-muted/40 p-3 border">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span>Lead (10%)</span>
                        <span className="text-muted-foreground">1</span>
                      </div>
                      <div className="rounded border bg-card p-3 shadow-sm">
                        <p className="text-sm font-medium">StartupXYZ - Pilot</p>
                        <p className="text-xs text-muted-foreground">€12.000</p>
                        <div className="mt-2 text-[10px] text-muted-foreground">Verwacht: binnen 60 dagen</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 border">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span>Qualified (25%)</span>
                        <span className="text-muted-foreground">1</span>
                      </div>
                      <div className="rounded border bg-card p-3 shadow-sm">
                        <p className="text-sm font-medium">Global Solutions - Implementation</p>
                        <p className="text-xs text-muted-foreground font-semibold text-primary">€85.000</p>
                        <div className="mt-2 text-[10px] text-muted-foreground">Contact: Michael Chen</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 border">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span>Proposal (50%)</span>
                        <span className="text-muted-foreground">1</span>
                      </div>
                      <div className="rounded border bg-card p-3 shadow-sm">
                        <p className="text-sm font-medium">TechFlow - Team Plan</p>
                        <p className="text-xs text-muted-foreground font-semibold text-primary">€36.000</p>
                        <div className="mt-2 text-[10px] text-muted-foreground">Offerte verstuurd</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 border">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span>Negotiation (75%)</span>
                        <span className="text-muted-foreground">1</span>
                      </div>
                      <div className="rounded border bg-card p-3 shadow-sm border-primary/40">
                        <p className="text-sm font-medium">Acme Corp - Enterprise</p>
                        <p className="text-xs font-bold text-emerald-600">€150.000</p>
                        <div className="mt-2 text-[10px] text-muted-foreground">Sluiting: deze maand</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: ATS Recruitment Preview */}
              {activeTab === 'ats' && (
                <div className="rounded-xl bg-background border p-4 sm:p-6 text-left animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{t('Candidate Tracking & Jobs')}</h4>
                      <p className="text-xs text-muted-foreground">4 openstaande vacatures • 18 sollicitanten in proces</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      ATS Module
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          AW
                        </div>
                        <div>
                          <p className="font-medium text-sm">Alice Williams</p>
                          <p className="text-xs text-muted-foreground">Senior React &amp; TypeScript Developer • San Francisco, CA</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">Interview Stage</Badge>
                        <span className="text-xs font-semibold text-muted-foreground">€120.000 / jr</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          JL
                        </div>
                        <div>
                          <p className="font-medium text-sm">Jennifer Lee</p>
                          <p className="text-xs text-muted-foreground">Product Manager • Austin, TX</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">Aanbod Fase</Badge>
                        <span className="text-xs font-semibold text-muted-foreground">€130.000 / jr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Contact Center Preview */}
              {activeTab === 'contact' && (
                <div className="rounded-xl bg-background border p-4 sm:p-6 text-left animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{t('Interactive Agent Workspace & Pitch Flow')}</h4>
                      <p className="text-xs text-muted-foreground">Outbound Q4 Campagne • Dynamische beslisboom</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-600">Gesprek Actief (04:12)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <p className="text-xs font-bold uppercase text-muted-foreground">Belscript Stap 2</p>
                      <h5 className="font-semibold text-sm">Waardepropositie &amp; Behoefteanalyse</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "Wij helpen bedrijven in de technologiesector om hun salescycli te halveren via realtime Firestore synchronisatie. Hoe beheren jullie momenteel follow-ups?"
                      </p>
                      <div className="pt-2 flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs h-8">Geïnteresseerd</Button>
                        <Button size="sm" variant="outline" className="text-xs h-8">Bezwaar: Geen Budget</Button>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <p className="text-xs font-bold uppercase text-muted-foreground">Contact Informatie</p>
                      <h5 className="font-semibold text-sm">John Smith — Acme Corp</h5>
                      <p className="text-xs text-muted-foreground">VP of Sales • Enterprise Klant</p>
                      <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">Decision Maker</Badge>
                        <Badge variant="outline">Hot Lead</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Gamification Preview */}
              {activeTab === 'gamification' && (
                <div className="rounded-xl bg-background border p-4 sm:p-6 text-left animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{t('Team Leaderboard & Rewards')}</h4>
                      <p className="text-xs text-muted-foreground">Maandelijkse Sales Competitie • Streaks &amp; Badges</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Level 15 Sales Legend
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/30">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-bold text-xs">#1</span>
                        <div>
                          <p className="font-semibold text-sm">Maria Garcia</p>
                          <p className="text-xs text-muted-foreground">24 Deals Gesloten • 23 Dagen Streak</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-amber-600">15.800 Pts</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-bold text-xs">#2</span>
                        <div>
                          <p className="font-semibold text-sm">Alex Johnson</p>
                          <p className="text-xs text-muted-foreground">18 Deals Gesloten • 15 Dagen Streak</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-primary">12.500 Pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* STATS & IMPACT SECTION */}
        {/* ===================================================================== */}
        <section className="border-y bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-primary">+48%</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('Average Deal Conversion Rate')}</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground">3.5x</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('Faster Candidate Placements')}</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-500">24/7</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('Realtime Cloud Firestore Sync')}</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground">&lt; 60s</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('Lead Response & Follow-up Time')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* ALL-IN-ONE MODULES SECTION */}
        {/* ===================================================================== */}
        <section id="modules" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                {t('All-in-One Architecture')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t('Everything your team needs under one roof')}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                {t('No more subscribing to five separate disconnected tools. CRMos provides end-to-end functionality seamlessly connected.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Smart CRM & Pipelines')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visualiseer deals in Kanban-fases, bereken slagingskansen en behoud volledig overzicht over alle contacten, organisaties en communicatiehistorie.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> 360° Klanttijdlijn &amp; activiteitensync</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Aangepaste velden &amp; tags</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Full ATS Recruitment')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Beheer sollicitanten van screening tot aanbod. Koppel kandidaten aan vacatures, houd salarisindicaties bij en versnel plaatsingen.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Sollicitatiefasen &amp; skills-tracking</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Matchingscores &amp; recruiter-notities</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Contact Center Workspace')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Speciaal gebouwd voor telemarketeers en binnendienst. Inclusief interactieve pitch flows, call dispositions en actieve timer.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Dynamische vertakkingsscripts</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Inbound &amp; outbound campagnes</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Gamification & Leaderboard')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Motiveer verkoop- en recruitmentteams met realtime scoreborden, badges, prestatiestreaks en automatische commissiecalculatie.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Doelen, levels en achievements</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Commissietracking per gesloten deal</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <Workflow className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Workflows & Automations')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automatiseer repetitieve taken zonder een regel code. Stuur e-mails, maak follow-up taken aan en verplaats deals automatisch bij acties.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Trigger &amp; Action no-code builder</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Webhooks &amp; vertraagde acties</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{t('Territories & Rayons')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wijs postcodes en geografische regio's direct toe aan specifieke accountmanagers en buitendienst met GeoJSON-polygonen.
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground pt-2">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Regiogebonden prestatie-inzichten</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Postcodereeks toewijzing</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* TESTIMONIALS */}
        {/* ===================================================================== */}
        <section className="border-t bg-muted/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                {t('Loved by Growth Teams')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t('What our customers say')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((test, index) => (
                <Card key={index} className="border bg-card shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex text-amber-500">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{test.content}"
                    </p>
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-sm">{test.name}</p>
                      <p className="text-xs text-muted-foreground">{test.role} • {test.company}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* FAQ SECTION */}
        {/* ===================================================================== */}
        <section id="faq" className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                {t('FAQ')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t('Frequently Asked Questions')}
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* FINAL HIGH-CONVERSION CTA */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden py-20 bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {t('Accelerate your sales and recruitment today')}
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              {t('Join hundreds of commercial teams that manage deals and candidates seamlessly with CRMos.')}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-background text-foreground hover:bg-background/90 shadow-xl transition-all"
              >
                {t('Create Free Account')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto h-12 px-8 text-base font-medium border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all"
              >
                {t('View Pricing')}
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/70">
              14 dagen gratis • Geen verplichtingen • Binnen 2 minuten up-and-running
            </p>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
