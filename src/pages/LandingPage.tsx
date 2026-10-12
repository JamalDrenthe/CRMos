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
  Target,
  Trophy,
  CheckCircle2,
  Star,
  ChevronRight,
  Zap,
  Sparkles,
  Flame,
  Layers,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'crm' | 'ats' | 'contact' | 'gamification'>('crm');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
      {/* Top Apple-style Frosted Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ===================================================================== */}
        {/* APPLE CINEMATIC HERO SECTION */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          {/* Apple ambient illumination glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[450px] h-[320px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Apple Eyebrow Pill with Animated Logo */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground backdrop-blur-md shadow-sm mb-8 hover:bg-muted/70 transition-all group">
              <CRMosLogo size="xs" showText={false} />
              <span className="font-semibold text-foreground">CRMos 2.0</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{t('The Operating System for Growth')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            {/* Apple Hero Title */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[-0.035em] text-foreground max-w-5xl mx-auto leading-[1.04]">
              Titanium kracht.{' '}
              <span className="block mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Ongekende eenvoud.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg sm:text-2xl text-muted-foreground font-normal tracking-tight max-w-3xl mx-auto leading-relaxed text-balance">
              {t('Manage leads, accelerate deals, hire top talent and empower phone agents. An all-in-one platform with realtime pipeline sync, dynamic pitch flows and team gamification.')}
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
                variant="ghost"
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto h-12 rounded-full px-6 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all group gap-1"
              >
                <span>{t('View Pricing & Plans')}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>

            {/* Apple Trust Micro-badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('No credit card required')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('Live within 2 minutes')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('GDPR-proof & Secure')}</span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* APPLE HARDWARE FRAME / STUDIO DISPLAY SHOWCASE */}
            {/* ================================================================= */}
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
                    <span>CRMos v2.4 • Operating System</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">Firestore Connected</span>
                  </div>
                </div>

                {/* Showcase Tab Selector (Apple Segmented Control) */}
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
                    <span>{t('Recruitment & ATS')}</span>
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
                    <span>{t('Contact Center Workspace')}</span>
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
                    <span>{t('Gamification & 360°')}</span>
                  </button>
                </div>

                {/* Tab 1: Sales CRM Preview */}
                {activeTab === 'crm' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div>
                        <h4 className="font-semibold text-lg text-white">{t('Sales Pipeline Overview')}</h4>
                        <p className="text-xs text-neutral-400">Totale pijplijnwaarde: €358.000 • 5 actieve deals</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 font-medium">
                        Live Firestore Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Lead (10%)</span>
                          <span className="text-neutral-500">1</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">StartupXYZ - Pilot</p>
                          <p className="text-xs text-neutral-400 mt-0.5">€12.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Verwacht: 60 dagen</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Qualified (25%)</span>
                          <span className="text-neutral-500">1</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">Global Solutions - Implementation</p>
                          <p className="text-xs font-semibold text-blue-400 mt-0.5">€85.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Contact: Michael Chen</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Proposal (50%)</span>
                          <span className="text-neutral-500">1</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">TechFlow - Team Plan</p>
                          <p className="text-xs font-semibold text-blue-400 mt-0.5">€36.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Offerte verstuurd</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-neutral-300">
                          <span>Closing (80%)</span>
                          <span className="text-emerald-400 font-semibold">2</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-sm">
                          <p className="text-sm font-medium text-white">Enterprise Corp - SaaS License</p>
                          <p className="text-xs font-semibold text-emerald-400 mt-0.5">€175.000</p>
                          <div className="mt-2 text-[10px] text-neutral-500">Contract in review</div>
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
                        <h4 className="font-semibold text-lg text-white">{t('Candidate Pipeline & ATS')}</h4>
                        <p className="text-xs text-neutral-400">Vacature: Senior Full Stack Developer • 12 Kandidaten</p>
                      </div>
                      <span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 font-medium">
                        AI Matching: 98%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="rounded-xl border border-white/10 bg-neutral-900 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-neutral-300">Screening</span>
                          <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5">Nieuw</span>
                        </div>
                        <p className="font-medium text-sm text-white">Sophie de Vries</p>
                        <p className="text-xs text-neutral-400">TypeScript, React, Node.js</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Salaris: €65.000</span>
                          <span className="text-emerald-400 font-medium">94% Match</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-neutral-900 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-neutral-300">Technisch Interview</span>
                          <span className="text-[10px] rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5">In Review</span>
                        </div>
                        <p className="font-medium text-sm text-white">Lars Bakker</p>
                        <p className="text-xs text-neutral-400">Go, Kubernetes, Cloud Firestore</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Salaris: €72.000</span>
                          <span className="text-emerald-400 font-medium">98% Match</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-neutral-900 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-neutral-300">Aanbod</span>
                          <span className="text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5">Aanbod Verzonden</span>
                        </div>
                        <p className="font-medium text-sm text-white">Emma van Dijk</p>
                        <p className="text-xs text-neutral-400">Lead Architect, Python, AWS</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Salaris: €85.000</span>
                          <span className="text-emerald-400 font-medium">99% Match</span>
                        </div>
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
                          <h4 className="font-semibold text-lg text-white">{t('Live Call Workspace')}</h4>
                          <p className="text-xs text-neutral-400">Inbound Call: +31 20 894 1200 • Duur: 03:42</p>
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
                            Optie A: Traag contact
                          </button>
                          <button type="button" className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                            Optie B: Geen inzicht
                          </button>
                          <button type="button" className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                            Optie C: Hoge kosten
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

                {/* Tab 4: Gamification Preview */}
                {activeTab === 'gamification' && (
                  <div className="rounded-2xl bg-neutral-950 border border-white/10 p-5 sm:p-7 text-left text-white animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-5 gap-2">
                      <div>
                        <h4 className="font-semibold text-lg text-white">{t('Team Leaderboard & Rewards')}</h4>
                        <p className="text-xs text-neutral-400">Maandelijkse Sales Competitie • Streaks &amp; Badges</p>
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
                            <p className="text-xs text-neutral-400">24 Deals Gesloten • 23 Dagen Streak</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-amber-400">15.800 Pts</span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-neutral-900">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-neutral-300 font-bold text-xs">
                            #2
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-white">Alex Johnson</p>
                            <p className="text-xs text-neutral-400">18 Deals Gesloten • 15 Dagen Streak</p>
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
        {/* APPLE METRICS BAR */}
        {/* ===================================================================== */}
        <section className="border-y border-border/40 bg-muted/20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">+48%</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{t('Average Deal Conversion Rate')}</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">3.5x</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{t('Faster Candidate Placements')}</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-500">24/7</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{t('Realtime Cloud Firestore Sync')}</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">&lt; 60s</p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{t('Lead Response & Follow-up Time')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* APPLE BENTO GRID: PRO ARCHITECTURE */}
        {/* ===================================================================== */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Pro Architectuur</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground text-balance">
                Doordacht tot in elk detail.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Geen verzameling van losse plug-ins, maar een geïntegreerd besturingssysteem gebouwd voor absolute snelheid, betrouwbaarheid en precisie.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bento 1: Large Span 2 */}
              <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="max-w-md space-y-3 relative z-10">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Omnichannel Softphone &amp; Live Belscripts
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Voer telefonische verkoopgesprekken direct vanuit je browser. Interactieve pitch flows begeleiden telemarketeers met realtime bezwaarafhandeling en geautomatiseerde call dispositions.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl bg-muted/40 border border-border/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Audio Waveform
                    </span>
                    <span className="font-mono">02:14 / 05:00</span>
                  </div>
                  <div className="h-8 flex items-center gap-1">
                    {[35, 60, 45, 80, 95, 40, 70, 85, 30, 90, 65, 40, 75, 95, 55, 30, 80, 60, 40, 70].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 bg-primary/40 rounded-full transition-all group-hover:bg-primary/70"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bento 2: Firestore Speed */}
              <div className="rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl hover:shadow-xl transition-all space-y-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Sub-milliseconde Firestore Sync
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Elke dealwijziging, notitie en oproep wordt instant gesynchroniseerd met Google Cloud Firestore. Met volledige offline-ondersteuning.
                </p>
                <div className="pt-2">
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-xs font-mono text-muted-foreground">
                    Sync Latency: &lt; 0.2ms
                  </div>
                </div>
              </div>

              {/* Bento 3: AI Copilot */}
              <div className="rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl hover:shadow-xl transition-all space-y-4">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Gemini AI Deal Intelligence
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automatische samenvattingen van klantgesprekken en voorspellende scores die je vertellen welke deals de hoogste kans van slagen hebben.
                </p>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-purple-400">
                  ★ Deal Closing Kans: 87%
                </div>
              </div>

              {/* Bento 4: Gamification */}
              <div className="rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl hover:shadow-xl transition-all space-y-4">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Flame className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Streaks, Badges &amp; XP
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Motiveer commerciële teams met interactieve prestatieladders, dagelijkse belstreaks en geautomatiseerde commissieoverzichten.
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                  <Trophy className="h-4 w-4" />
                  <span>23 Dagen Record Streak</span>
                </div>
              </div>

              {/* Bento 5: Large Span 2 */}
              <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl hover:shadow-xl transition-all relative overflow-hidden">
                <div className="max-w-md space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    360° Klant- &amp; Relatie-intelligentie
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Eén centrale tijdlijn voor al je interacties. Van het eerste koude telefoongesprek tot offertes, handtekeningen en onboarding.
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Contacten</p>
                    <p className="text-lg font-bold text-foreground">Onbeperkt</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Rayons</p>
                    <p className="text-lg font-bold text-foreground">Postcode Geo</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Offertes</p>
                    <p className="text-lg font-bold text-foreground">1-Click PDF</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Beveiliging</p>
                    <p className="text-lg font-bold text-emerald-500">GDPR Ready</p>
                  </div>
                </div>
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
                Vertrouwd door toonaangevende teams.
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
