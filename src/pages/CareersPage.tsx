import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import { Footer } from '@/components/layout/Footer';
import {
  NO_CURE_NO_PAY_JOBS,
  ARBEIDSVOORWAARDEN_STANDAARD,
  type NoCureNoPayJob,
} from '@/data/careersJobsData';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useCRMStore } from '@/stores/crmStore';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  Euro,
  ArrowRight,
  Calendar,
  Globe,
  Sparkles,
  Send,
  Eye,
  Clock,
  ChevronRight,
  GraduationCap,
  Armchair,
  Laptop,
  Check,
  Copy,
  Flame,
} from 'lucide-react';

export function CareersPage() {
  const { addCandidate } = useRecruitmentStore();
  const { addContact } = useCRMStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompensation, setSelectedCompensation] = useState<string>('all');
  const [activeJobDetail, setActiveJobDetail] = useState<NoCureNoPayJob | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<NoCureNoPayJob | null>(null);

  // Application Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLinkedIn, setFormLinkedIn] = useState('');
  const [formContractType, setFormContractType] = useState('ZZP / Freelance');
  const [formHours, setFormHours] = useState('32–40 uur per week');
  const [formExperienceYears, setFormExperienceYears] = useState('3-5 jaar');
  const [formMotivation, setFormMotivation] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    return NO_CURE_NO_PAY_JOBS.filter((job) => {
      if (selectedCategory !== 'all' && job.category !== selectedCategory) {
        return false;
      }
      if (selectedCompensation !== 'all') {
        const comp = job.compensationModel.toLowerCase();
        if (selectedCompensation === 'succesfee' && !comp.includes('succes')) return false;
        if (selectedCompensation === 'commissie' && !comp.includes('commissie') && !comp.includes('deal')) return false;
        if (selectedCompensation === 'plaatsing' && !comp.includes('plaatsing')) return false;
        if (selectedCompensation === 'marge' && !comp.includes('marge')) return false;
        if (selectedCompensation === 'courtage' && !comp.includes('courtage')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchDomain = job.domain.toLowerCase().includes(q);
        const matchCode = job.code.includes(q);
        const matchTasks = job.tasks.some((t) => t.toLowerCase().includes(q));
        const matchRequirements = job.requirements.some((r) => r.toLowerCase().includes(q));
        const matchTools = job.toolsAndStack.some((tool) => tool.toLowerCase().includes(q));
        return matchTitle || matchDomain || matchCode || matchTasks || matchRequirements || matchTools;
      }
      return true;
    });
  }, [selectedCategory, selectedCompensation, searchQuery]);

  const handleOpenApply = (job: NoCureNoPayJob) => {
    setApplyModalJob(job);
    setApplicationSuccess(null);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim() || !formPhone.trim()) {
      toast.error('Vul alle verplichte velden in (naam, e-mail en telefoonnummer)');
      return;
    }

    const targetJob = applyModalJob || NO_CURE_NO_PAY_JOBS[0];
    const generatedVvcTag = `vvc-job-${targetJob.code}-${Date.now().toString().slice(-5)}`;

    // 1. Direct opslaan in Recruitment Store als geverifieerde kandidaat
    const candidate = addCandidate({
      first_name: formFirstName.trim(),
      last_name: formLastName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      status: 'new',
      skills: [targetJob.title, targetJob.domain, formContractType],
      experience_years: parseInt(formExperienceYears) || 3,
      location: '100% Remote (Nederland / Europa)',
      source: `No Cure No Pay Funnel - [${targetJob.code}] ${targetJob.title}`,
      vvc_tag: generatedVvcTag,
    });

    // 2. Direct opslaan in CRM Contacts met VVC communicatietag en team-indeling
    addContact({
      first_name: formFirstName.trim(),
      last_name: formLastName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      company: 'Kandidaat No Cure No Pay',
      title: `${targetJob.title} (Aanmelding)`,
      status: 'lead',
      source: `Vacature [${targetJob.code}] ${targetJob.title}`,
      vvc_tag: generatedVvcTag,
      team_name: 'Team Jamal Drenthe',
      team_status: 'active',
      referred_by_name: 'Jamal Drenthe',
      tags: [
        generatedVvcTag,
        'No Cure No Pay',
        `Vacature-${targetJob.code}`,
        targetJob.title,
        formContractType,
        'Directe Aanmelding',
      ],
      social_profiles: formLinkedIn ? { linkedin: formLinkedIn.trim() } : undefined,
      custom_fields: {
        candidate_id: candidate.id,
        job_code: targetJob.code,
        job_title: targetJob.title,
        vvc_tag: generatedVvcTag,
        contract_type: formContractType,
        hours: formHours,
        experience_years: formExperienceYears,
      },
      notes: `Aangemeld voor functie: [${targetJob.code}] ${targetJob.title}.\nContractvoorkeur: ${formContractType} (${formHours}).\nErvaring: ${formExperienceYears}.\nToelichting: ${formMotivation || 'Geen extra toelichting'}\nKandidaat ID: ${candidate.id}`,
    });

    setApplicationSuccess(generatedVvcTag);
    toast.success(`Sollicitatie succesvol ingediend voor [${targetJob.code}] ${targetJob.title}!`);
  };

  const getCategoryBadgeClass = (category: NoCureNoPayJob['category']) => {
    switch (category) {
      case 'finance':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'sales':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'recruitment':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'strategy':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <CRMosLogo size="sm" showTagline={false} />
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Careers &amp; Partners
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/solutions"
              className="hidden md:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Oplossingen
            </Link>
            <Link
              to="/pricing"
              className="hidden md:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Prijzen
            </Link>
            <Link
              to="/login"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Inloggen
            </Link>
            <Button
              size="sm"
              onClick={() => {
                const el = document.getElementById('vacature-overzicht');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full h-8 px-4 text-xs font-semibold shadow-xs"
            >
              <span>Bekijk 13 Functies</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/40 bg-gradient-to-b from-primary/[0.04] via-transparent to-background">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Internationale Tech-, AI- &amp; Vastgoedgroep</span>
            <span className="text-muted-foreground opacity-60">•</span>
            <span>100% Remote</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            13 High-Impact Functies met <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
              No Cure No Pay &amp; Prestatiebeloning
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed text-balance">
            Directe samenwerking met een snelgroeiend internationaal conglomeraat actief in GPU-compute, AI-software, B2B-recruitment en zakelijke vastgoedclusters. Wij belonen directe executie, netwerk en omzet met transparante succesfees, margedeling en dealcommissies.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs text-center">
              <p className="text-2xl font-bold text-foreground">13</p>
              <p className="text-xs text-muted-foreground mt-0.5">Openstaande Sleutelrollen</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Remote &amp; Flexibel</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs text-center">
              <p className="text-2xl font-bold text-primary">ZZP of Vast</p>
              <p className="text-xs text-muted-foreground mt-0.5">Contract op Maat</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">Directe Fee</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bij Iedere Succesvolle Deal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explainer: Hoe werkt het No Cure No Pay & Prestatie Model? (Zonder vaagtaal of AI-slop) */}
      <section className="py-12 sm:py-16 border-b border-border/40 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Transparantie Voorop: Hoe Werkt Ons Beloningsmodel?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Geen verborgen addertjes of onhaalbare KPI's. Heldere afspraken waarin jouw inzet en netwerk direct evenredig worden uitbetaald.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-sm text-foreground">Salaris + Directe Prestatiefee</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Elke rol combineert een bespreekbaar basistarief of salaris met een directe succesfee (percentage, plaatsingsfee of commissie) over gerealiseerd volume, gesloten contracten of financieringen.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-sm text-foreground">Heldere 'Cure' Criteria</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Per functie is exact vastgelegd wanneer het succes behaald is: bij de gestorte investering, het digitaal getekende sponsorcontract, de startdatum van de specialist of de subsidietoekenning.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-sm text-foreground">ZZP / Freelance of Vast Dienstverband</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kies zelf de contractvorm die bij jouw situatie past: als zelfstandig ondernemer (ZZP) met maximale provisie op factuurbasis, of in loondienstverband (24–40 uur) met secundaire arbeidsvoorwaarden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Arbeidsvoorwaarden Grid (Geldend voor alle 13 functies) */}
      <section className="py-12 sm:py-16 border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Standaard Pakket
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                Arbeidsvoorwaarden &amp; Faciliteiten
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Deze voorwaarden gelden uniform voor alle 13 functies binnen de internationale groep.
              </p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-xs px-3 py-1">
              HBO / WO Werk- en Denkniveau
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ARBEIDSVOORWAARDEN_STANDAARD.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {item.icon === 'Globe' && <Globe className="h-4 w-4" />}
                    {item.icon === 'Laptop' && <Laptop className="h-4 w-4" />}
                    {item.icon === 'Armchair' && <Armchair className="h-4 w-4" />}
                    {item.icon === 'Calendar' && <Calendar className="h-4 w-4" />}
                    {item.icon === 'GraduationCap' && <GraduationCap className="h-4 w-4" />}
                    {item.icon === 'Sparkles' && <Sparkles className="h-4 w-4" />}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-foreground">{item.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Vacatures Overzicht & Filter Matrix */}
      <section id="vacature-overzicht" className="py-12 sm:py-20 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Vacature Overzichtsmatrix
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
                Alle 13 No Cure No Pay Sleutelposities
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Kies jouw domein, bekijk de exacte vergoedingsvoorwaarden en dien direct je kandidatuur in.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Beschikbaar:</span>
              <Badge variant="secondary" className="font-bold text-xs px-2.5 py-0.5">
                {filteredJobs.length} van {NO_CURE_NO_PAY_JOBS.length} functies
              </Badge>
            </div>
          </div>

          {/* Zoekbalk & Filters */}
          <div className="space-y-3 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op functietitel, domein, tools (bijv. Bloomberg, Python, DocuSign) of taken..."
                  className="pl-10 h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCompensation}
                  onChange={(e) => setSelectedCompensation(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium"
                >
                  <option value="all">Alle Vergoedingsmodellen</option>
                  <option value="succesfee">Succesfee (%)</option>
                  <option value="commissie">Commissie / Dealfee</option>
                  <option value="plaatsing">Plaatsingsfee</option>
                  <option value="marge">Margedeling (Detachering)</option>
                  <option value="courtage">Doorlopende Courtage</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'all', label: 'Alle 13 Functies' },
                { id: 'finance', label: 'Corporate Finance & Funding' },
                { id: 'sales', label: 'Sales, Closing & Growth' },
                { id: 'recruitment', label: 'Recruitment & Headhunting' },
                { id: 'strategy', label: 'Strategy & Subsidies' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {(searchQuery || selectedCategory !== 'all' || selectedCompensation !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedCompensation('all');
                  }}
                  className="text-xs text-destructive hover:underline ml-2"
                >
                  Filters herstellen
                </button>
              )}
            </div>
          </div>

          {/* Matrix Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="rounded-2xl border-border/60 hover:border-primary/50 transition-all flex flex-col justify-between hover:shadow-lg bg-card group"
              >
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        ID: {job.code}
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${getCategoryBadgeClass(job.category)}`}>
                        {job.categoryLabel}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {job.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {job.domain}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Euro className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{job.compensationModel}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.compensationSummary}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {job.aboutRole}
                    </p>

                    <div className="space-y-1 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{job.hours} • {job.contractType}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{job.education} ({job.experienceYears})</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveJobDetail(job)}
                      className="rounded-xl text-xs h-9 px-3 gap-1 hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details &amp; Taken</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenApply(job)}
                      className="rounded-xl text-xs h-9 px-3.5 gap-1 font-semibold"
                    >
                      <span>Solliciteren</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 space-y-3">
              <p className="text-sm font-semibold text-foreground">Geen functies gevonden voor deze zoekopdracht</p>
              <p className="text-xs text-muted-foreground">Probeer een andere categorie of herstel de filters.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedCompensation('all');
                }}
                className="rounded-full text-xs"
              >
                Alle 13 functies tonen
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 4-Stappen Procedure Banner */}
      <section className="py-12 border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Snel &amp; Transparant
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              De Sollicitatie- &amp; Onboardingprocedure
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1.5 text-center">
              <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs inline-flex items-center justify-center">
                1
              </span>
              <p className="font-bold text-xs text-foreground">Kennismaking</p>
              <p className="text-[11px] text-muted-foreground">
                Stuur je gegevens of LinkedIn via het formulier met vacature-ID.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1.5 text-center">
              <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs inline-flex items-center justify-center">
                2
              </span>
              <p className="font-bold text-xs text-foreground">Videogesprek (30 min)</p>
              <p className="text-[11px] text-muted-foreground">
                Scherp gesprek over je trackrecord, beschikbaarheid en fee-structuur.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1.5 text-center">
              <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs inline-flex items-center justify-center">
                3
              </span>
              <p className="font-bold text-xs text-foreground">Contract &amp; Setup</p>
              <p className="text-[11px] text-muted-foreground">
                Modelovereenkomst (ZZP of vast), apparatuur in bruikleen &amp; academie.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1.5 text-center">
              <span className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs inline-flex items-center justify-center">
                4
              </span>
              <p className="font-bold text-xs text-foreground">Start 100% Remote</p>
              <p className="text-[11px] text-muted-foreground">
                Direct aan de slag met warme leads, data en persoonlijke begeleiding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VACATURE DETAIL MODAL */}
      <Dialog open={!!activeJobDetail} onOpenChange={(open) => !open && setActiveJobDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          {activeJobDetail && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    VACATURE [{activeJobDetail.code}/13]
                  </span>
                  <Badge variant="outline" className={`text-xs ${getCategoryBadgeClass(activeJobDetail.category)}`}>
                    {activeJobDetail.categoryLabel}
                  </Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground mt-2">
                  {activeJobDetail.title}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-primary font-medium">{activeJobDetail.domain}</p>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Locatie</span>
                  <strong className="text-foreground">{activeJobDetail.location}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Uren per week</span>
                  <strong className="text-foreground">{activeJobDetail.hours}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Dienstverband</span>
                  <strong className="text-foreground">{activeJobDetail.contractType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Opleidingsniveau</span>
                  <strong className="text-foreground">{activeJobDetail.education}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Ervaring</span>
                  <strong className="text-foreground">{activeJobDetail.experienceYears}</strong>
                </div>
              </div>

              {/* Over de Rol */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Over de Rol</h4>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {activeJobDetail.aboutRole}
                </p>
              </div>

              {/* Taken */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Concrete Werkzaamheden</h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-foreground">
                  {activeJobDetail.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Profiel & Eisen */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wat Wij Vragen</h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-foreground">
                  {activeJobDetail.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Beloning & Rekenvoorbeeld */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <strong className="text-emerald-700 dark:text-emerald-300">Beloningsstructuur &amp; No Cure No Pay Fee</strong>
                </div>
                <p className="text-foreground">{activeJobDetail.compensationSummary}</p>
                <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/20 text-xs text-muted-foreground">
                  <strong className="text-foreground block mb-0.5">Rekenvoorbeeld:</strong>
                  {activeJobDetail.compensationExample}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  <strong>Cure criterium:</strong> {activeJobDetail.successCriteria}
                </p>
              </div>

              {/* Tools & Stack */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gebruikte Tools &amp; Systemen</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeJobDetail.toolsAndStack.map((tool, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/50 gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveJobDetail(null)} className="rounded-xl">
                  Sluiten
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const j = activeJobDetail;
                    setActiveJobDetail(null);
                    handleOpenApply(j);
                  }}
                  className="rounded-xl gap-1.5 font-semibold"
                >
                  <span>Direct Solliciteren op [{activeJobDetail.code}]</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIRECT SOLLICITATIE MODAL */}
      <Dialog open={!!applyModalJob} onOpenChange={(open) => !open && setApplyModalJob(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <span>Solliciteren: [{applyModalJob?.code}] {applyModalJob?.title}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Direct aangesloten op het CRMos recruitment- &amp; partnernetwerk.
            </p>
          </DialogHeader>

          {applicationSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Sollicitatie Succesvol Ontvangen!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Je profiel is direct vastgelegd in ons recruitment pipeline en gekoppeld aan de internationale directie.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 max-w-xs mx-auto text-left space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                  Jouw Unieke VVC API Tag:
                </span>
                <div className="flex items-center justify-between gap-2 font-mono text-xs font-bold text-foreground">
                  <span className="truncate">{applicationSuccess}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(applicationSuccess);
                      toast.success('VVC Tag gekopieerd');
                    }}
                    className="p-1 text-amber-600 hover:text-amber-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border text-xs text-left text-muted-foreground space-y-1">
                <strong className="text-foreground block">Volgende stap:</strong>
                Binnen 24 uur ontvang je een uitnodiging voor een virtueel kennismakingsgesprek van 30 minuten.
              </div>

              <Button
                onClick={() => {
                  setApplyModalJob(null);
                  setApplicationSuccess(null);
                }}
                className="rounded-xl w-full"
              >
                Sluiten
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-3.5 py-2 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Voornaam *</Label>
                  <Input
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="bijv. Alex"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Achternaam *</Label>
                  <Input
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="bijv. Jansen"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">E-mailadres *</Label>
                  <Input
                    required
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="naam@domein.nl"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Telefoonnummer *</Label>
                  <Input
                    required
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+31 6 12345678"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Gewenste Contractvorm</Label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                  >
                    <option value="ZZP / Freelance">ZZP / Freelance (Overeenkomst van Opdracht)</option>
                    <option value="Vast / Hybride">Vast Contract / Hybride (Salaris + Fee)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Beschikbaarheid</Label>
                  <select
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                  >
                    <option value="32–40 uur per week">Fulltime (32–40 uur)</option>
                    <option value="24–32 uur per week">Parttime (24–32 uur)</option>
                    <option value="Flexibel per project">Flexibel per project</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ervaringsniveau in dit domein</Label>
                <select
                  value={formExperienceYears}
                  onChange={(e) => setFormExperienceYears(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                >
                  <option value="1-3 jaar">1–3 jaar relevante ervaring</option>
                  <option value="3-5 jaar">3–5 jaar relevante ervaring</option>
                  <option value="5-8 jaar">5–8 jaar relevante ervaring (Senior)</option>
                  <option value="8+ jaar">8+ jaar aantoonbaar topniveau (Lead / Principal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">LinkedIn Profiel of CV URL (Optioneel)</Label>
                <Input
                  value={formLinkedIn}
                  onChange={(e) => setFormLinkedIn(e.target.value)}
                  placeholder="https://linkedin.com/in/jouwnaam"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Korte Motivatie &amp; Trackrecord</Label>
                <Textarea
                  value={formMotivation}
                  onChange={(e) => setFormMotivation(e.target.value)}
                  placeholder="Beschrijf beknopt jouw ervaring, netwerk en waarom dit No Cure No Pay / succesfeemodel jou aanspreekt..."
                  className="min-h-[75px] text-xs resize-none"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setApplyModalJob(null)} className="rounded-xl">
                  Annuleren
                </Button>
                <Button type="submit" size="sm" className="rounded-xl font-semibold gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  <span>Sollicitatie Indienen</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
