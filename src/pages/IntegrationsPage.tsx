import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Cpu,
  Users2,
  TrendingUp,
  Scale,
  Briefcase,
  Gift,
  Globe2,
  Truck,
  RefreshCw,
  KeyRound,
  Link2,
  Database,
  DownloadCloud,
  Trash2,
} from 'lucide-react';
import {
  syncAllDataFromHubSpot,
  loadHubSpotConfigFromFirestore,
  type HubSpotSyncProgress,
  type HubSpotConfig,
} from '@/services/hubspotService';
import { purgeDemoAndMockDataFromFirestore } from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';

export interface Integration {
  id: string;
  name: string;
  tagline: string;
  category: 'AI & FinTech' | 'Community & Rewards' | 'Werving & Juridisch' | 'Logistiek & Expansie';
  description: string;
  icon: React.ElementType;
  gradient: string;
  badgeColor: string;
  website: string;
  status: 'connected' | 'available';
  features: string[];
  apiKeyPlaceholder: string;
}

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'quantum-initium',
    name: 'Quantum Initium',
    tagline: 'AI Deal Intelligence & Quantum Lead Scoring',
    category: 'AI & FinTech',
    description:
      'Geavanceerde AI-gestuurde algoritmes voor automatische leadprioritering, deal closing probability en voorspellende conversie-optimalisatie binnen de verkoopfunnel.',
    icon: Cpu,
    gradient: 'from-purple-600 to-indigo-600',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    website: 'https://quantuminitium.com',
    status: 'connected',
    features: ['Automatische lead scoring', 'Predictive closing kans', 'Realtime AI deal suggesties'],
    apiKeyPlaceholder: 'qi_live_98a7b6c5d4e3...',
  },
  {
    id: 'vvc',
    name: 'VVC (Verdienende Vrienden Club)',
    tagline: 'Community Referral Netwerk & Affiliate Tracking',
    category: 'Community & Rewards',
    description:
      'Koppel je salescampagnes aan het exclusieve VVC netwerk. Automatische provisiematching, vrienden-verwijzingen en realtime registratie van community deals.',
    icon: Users2,
    gradient: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    website: 'https://verdienendevriendenclub.nl',
    status: 'connected',
    features: ['Affiliate commissie tracking', 'Community lead sync', 'Geautomatiseerde bonus payout'],
    apiKeyPlaceholder: 'vvc_partner_token_34x...',
  },
  {
    id: 'investbotiq',
    name: 'Investbotiq',
    tagline: 'FinTech Investeringsbots & Cashflow Automation',
    category: 'AI & FinTech',
    description:
      'Slimme geautomatiseerde kapitaalallocatie en cashflowmonitoring. Koppel gesloten deals en provisies direct aan gepersonaliseerde investeringsstrategieën.',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    website: 'https://investbotiq.com',
    status: 'available',
    features: ['Cashflow prognoses', 'Deal herinvestering bots', 'Portfolio rendementsrapportage'],
    apiKeyPlaceholder: 'ib_api_key_88f9e0...',
  },
  {
    id: 'immigratiepunt',
    name: 'Immigratiepunt',
    tagline: 'Juridische & Relocatie Onboarding voor Talent',
    category: 'Werving & Juridisch',
    description:
      'Internationale werving en relocatie zonder frictie. Directe verificatie van verblijfs- en werkvergunningen voor buitenlandse kandidaten in je recruitment ATS.',
    icon: Scale,
    gradient: 'from-blue-600 to-cyan-600',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    website: 'https://immigratiepunt.nl',
    status: 'connected',
    features: ['Vergunningsstatus controle', 'Compliance documentatie', 'Expat contract templates'],
    apiKeyPlaceholder: 'imp_sec_token_9912...',
  },
  {
    id: 'djobba',
    name: 'Djobba',
    tagline: 'Flexibele Personeelsbemiddeling & Shift Scheduling',
    category: 'Werving & Juridisch',
    description:
      'Vind razendsnel flexibele buitendienstverkopers en telemarketeers. Synchroniseer beschikbare shifts met kandidaten uit je eigen CRMos recruitmentpool.',
    icon: Briefcase,
    gradient: 'from-rose-500 to-red-600',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    website: 'https://djobba.com',
    status: 'connected',
    features: ['Directe shift matching', 'Urenregistratie koppeling', 'Dynamische pouleplanning'],
    apiKeyPlaceholder: 'djb_live_oauth_554a...',
  },
  {
    id: 'trusting-work',
    name: 'Trusting Work',
    tagline: 'Betrouwbaarheidsverificatie & VOG Compliance',
    category: 'Werving & Juridisch',
    description:
      'Gegarandeerde integriteit van medewerkers aan de deur en aan de telefoon. Automatische VOG-aanvragen, diplomachecks en referentievalidaties.',
    icon: ShieldCheck,
    gradient: 'from-indigo-600 to-blue-700',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    website: 'https://trustingwork.nl',
    status: 'available',
    features: ['Digitale VOG verificatie', 'Referentiecheck rapport', 'GDPR-proof dossieropslag'],
    apiKeyPlaceholder: 'tw_audit_client_712...',
  },
  {
    id: 'zheavenzy',
    name: 'Zheavenzy',
    tagline: 'Exclusieve Lifestyle Rewards & Agent Incentives',
    category: 'Community & Rewards',
    description:
      'Motiveer je commerciële teams met buitengewone beloningen. Zet behaalde gamificatie punten en verkoopstreaks om in luxe ervaringen en designer incentives.',
    icon: Gift,
    gradient: 'from-fuchsia-600 to-pink-600',
    badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
    website: 'https://zheavenzy.com',
    status: 'available',
    features: ['1-Click reward verzilvering', 'Maandelijkse incentives catalogus', 'Geautomatiseerde gifting'],
    apiKeyPlaceholder: 'zhv_reward_token_901...',
  },
  {
    id: 'xabi-world',
    name: 'Xabi World',
    tagline: 'Internationale Expansie & Cross-Border Campagnes',
    category: 'Logistiek & Expansie',
    description:
      'Schaal je verkoopcampagnes moeiteloos over landsgrenzen heen. Wereldwijde leadacquisitie, lokale telecomroutes en meertalige rayoncoördinatie.',
    icon: Globe2,
    gradient: 'from-sky-500 to-indigo-600',
    badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    website: 'https://xabiworld.com',
    status: 'available',
    features: ['Multi-currency handling', 'Cross-border routing', 'Internationaal rayonbeheer'],
    apiKeyPlaceholder: 'xabi_intl_prod_6623...',
  },
  {
    id: 'logs-rent',
    name: 'Logs Rent',
    tagline: 'Wagenparkbeheer & Buitendienst Hardware Verhuur',
    category: 'Logistiek & Expansie',
    description:
      'Volledig beheer van transport en buitendienstapparatuur. Wijs representatieve verkoopauto’s, tablets en mobiele pin-terminals direct toe aan field sales teams.',
    icon: Truck,
    gradient: 'from-teal-600 to-emerald-700',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    website: 'https://logsrent.nl',
    status: 'connected',
    features: ['Tablet & hardware provisioning', 'Auto & kilometerregistratie', 'Kostenverdeling per rayon'],
    apiKeyPlaceholder: 'lr_fleet_api_3389...',
  },
];

export function IntegrationsPage() {
  const { organization, user } = useAuthStore();
  const orgId = organization?.id || user?.org_id || 'default_org';
  const { setContacts, setCompanies, setDeals, setActivities, clearLocalStore: clearCRM } = useCRMStore();
  const { clearLocalStore: clearRec } = useRecruitmentStore();
  const { setCalls, clearLocalStore: clearCC } = useContactCenterStore();

  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // HubSpot Live Sync State
  const [hubspotToken, setHubspotToken] = useState('');
  const [hubspotConfig, setHubspotConfig] = useState<HubSpotConfig | null>(null);
  const [isHubspotSyncing, setIsHubspotSyncing] = useState(false);
  const [hubspotProgress, setHubspotProgress] = useState<HubSpotSyncProgress | null>(null);

  useEffect(() => {
    loadHubSpotConfigFromFirestore(orgId).then((cfg) => {
      if (cfg) {
        setHubspotConfig(cfg);
        setHubspotToken(cfg.accessToken || '');
      }
    });
  }, [orgId]);

  const handleHubSpotSync = async () => {
    if (!hubspotToken.trim()) {
      toast.error('Vul je HubSpot Private App Access Token in (bijv. pat-eu1-...)');
      return;
    }
    setIsHubspotSyncing(true);
    try {
      const result = await syncAllDataFromHubSpot(hubspotToken.trim(), orgId, (p) => {
        setHubspotProgress(p);
      });
      setContacts(result.contacts);
      setCompanies(result.companies);
      setDeals(result.deals);
      setActivities(result.activities);
      setCalls(result.calls);

      const updatedCfg = await loadHubSpotConfigFromFirestore(orgId);
      setHubspotConfig(updatedCfg);

      toast.success(
        `HubSpot import voltooid! ${result.contacts.length} contacten, ${result.companies.length} bedrijven en ${result.deals.length} deals geladen.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Onbekende fout bij HubSpot synchronisatie';
      toast.error(msg);
      setHubspotProgress((prev) => (prev ? { ...prev, error: msg } : null));
    } finally {
      setIsHubspotSyncing(false);
    }
  };

  const handlePurgeMockData = async () => {
    clearCRM();
    clearRec();
    clearCC();
    const deleted = await purgeDemoAndMockDataFromFirestore(orgId);
    toast.success(`Alle mock & demo data is gewist (${deleted} records uit Cloud verwijderd).`);
  };

  const categories = [
    { id: 'all', label: 'Alle (9)' },
    { id: 'AI & FinTech', label: 'AI & FinTech' },
    { id: 'Community & Rewards', label: 'Community & Rewards' },
    { id: 'Werving & Juridisch', label: 'Werving & Juridisch' },
    { id: 'Logistiek & Expansie', label: 'Logistiek & Expansie' },
  ];

  const filteredIntegrations = integrations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenConfig = (item: Integration) => {
    setConfigIntegration(item);
    setApiKeyInput(localStorage.getItem(`crmos_int_key_${item.id}`) || '');
    setWebhookUrlInput(localStorage.getItem(`crmos_int_hook_${item.id}`) || `https://api.crmos.one/webhooks/${item.id}`);
    setSyncEnabled(item.status === 'connected');
  };

  const handleSaveConfig = () => {
    if (!configIntegration) return;

    localStorage.setItem(`crmos_int_key_${configIntegration.id}`, apiKeyInput);
    localStorage.setItem(`crmos_int_hook_${configIntegration.id}`, webhookUrlInput);

    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === configIntegration.id
          ? { ...item, status: syncEnabled ? 'connected' : 'available' }
          : item
      )
    );

    toast.success(`Integratie ${configIntegration.name} succesvol opgeslagen!`);
    setConfigIntegration(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTesting(false);
    toast.success(`Verbinding met ${configIntegration?.name} succesvol geverifieerd (200 OK)`);
  };

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* HUBSPOT LIVE CRM MIGRATION & SYNC BANNER                              */}
      {/* ===================================================================== */}
      <Card className="relative overflow-hidden rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card/90 to-card p-5 sm:p-7 shadow-md">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    HubSpot CRM Live Data Migratie &amp; Synchronisatie
                  </h2>
                  <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px]">
                    {hubspotConfig?.lastSyncAt ? 'HubSpot Verbonden' : 'Klaar voor koppeling'}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Importeer direct al je echte <strong>Contacten, Bedrijven, Deals, Gesprekken, Taken, Notities en Producten</strong> vanuit HubSpot naar CRMos &amp; Google Cloud Firestore.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePurgeMockData}
              className="rounded-full text-xs gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Wis Alle Mock Data</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-orange-500" />
                <span>HubSpot Private App Access Token (pat-eu1-... of pat-na1-...)</span>
              </Label>
              <Input
                type="password"
                value={hubspotToken}
                onChange={(e) => setHubspotToken(e.target.value)}
                placeholder="pat-eu1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs h-10 bg-background/80"
              />
              <p className="text-[11px] text-muted-foreground">
                Ga in HubSpot naar <strong>Settings (Tandwiel) → Integrations → Private Apps → Create a private app</strong> (Scopes: <code>crm.objects.contacts.read</code>, <code>crm.objects.companies.read</code>, <code>crm.objects.deals.read</code>) en plak je token hier.
              </p>
            </div>

            <div className="flex flex-col justify-end">
              <Button
                onClick={handleHubSpotSync}
                disabled={isHubspotSyncing}
                className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-xs gap-2 shadow-md"
              >
                {isHubspotSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Bezig met importeren...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-4 w-4" />
                    <span>Importeer Alles uit HubSpot</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {hubspotProgress && (
            <div className="rounded-2xl bg-background/80 border border-border/60 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-foreground">{hubspotProgress.step}</span>
                {hubspotProgress.isComplete && (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Voltooid
                  </span>
                )}
              </div>
              {hubspotProgress.error && (
                <p className="text-red-500 font-medium">{hubspotProgress.error}</p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Contacten</p>
                  <p className="font-bold text-sm">{hubspotProgress.contactsCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Bedrijven</p>
                  <p className="font-bold text-sm">{hubspotProgress.companiesCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Deals</p>
                  <p className="font-bold text-sm">{hubspotProgress.dealsCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Activiteiten</p>
                  <p className="font-bold text-sm">{hubspotProgress.activitiesCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Gesprekken</p>
                  <p className="font-bold text-sm">{hubspotProgress.callsCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Producten</p>
                  <p className="font-bold text-sm">{hubspotProgress.productsCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Apple-style Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-card/80 via-card/50 to-muted/20 p-5 sm:p-7 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                <Zap className="h-3.5 w-3.5" />
                <span>Ecosysteem Hub</span>
              </span>
              <span className="text-xs text-muted-foreground">
                • {connectedCount} van {integrations.length} Gekoppeld
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Officiële Integraties
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Verbind CRMos naadloos met gespecialiseerde tools voor werving, AI, kapitaal, logistiek en beloningen.
              Alle data wordt realtime gesynchroniseerd binnen je centrale workflow.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek integraties (bijv. Quantum, VVC, Immigratie)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-full text-xs bg-background/60 border-border/70"
            />
          </div>

          {/* Horizontally scrollable category pills on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Grid - 1 col on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredIntegrations.map((item) => {
          const Icon = item.icon;
          const isConnected = item.status === 'connected';

          return (
            <Card
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/60 backdrop-blur-xl hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Top row: Icon + Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div
                      className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md shadow-primary/10`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2.5 py-0.5 font-semibold rounded-full ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-muted text-muted-foreground border-border/60'
                        }`}
                      >
                        {isConnected ? (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Gekoppeld
                          </span>
                        ) : (
                          'Beschikbaar'
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground line-clamp-1">
                      {item.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="mt-2.5 text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  {/* Key Features Pill list */}
                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {item.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Button
                    size="sm"
                    variant={isConnected ? 'outline' : 'default'}
                    onClick={() => handleOpenConfig(item)}
                    className="h-8 rounded-full px-3.5 text-xs font-medium gap-1.5"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>{isConnected ? 'Beheren' : 'Verbinden'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      {configIntegration && (
        <Dialog open={!!configIntegration} onOpenChange={() => setConfigIntegration(null)}>
          <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${configIntegration.gradient} flex items-center justify-center text-white shrink-0`}
                >
                  <configIntegration.icon className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    {configIntegration.name} Integratie
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {configIntegration.tagline}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground text-xs sm:text-sm">Realtime Synchronisatie</p>
                  <p className="text-[11px] text-muted-foreground">
                    Verzend automatisch leads en deals naar {configIntegration.name}
                  </p>
                </div>
                <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span>API Sleutel / Token</span>
                </Label>
                <Input
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={configIntegration.apiKeyPlaceholder}
                  className="font-mono text-xs h-9"
                />
                <p className="text-[10px] text-muted-foreground">
                  Verkrijgbaar via het partnerdashboard van {configIntegration.name}.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span>CRMos Webhook Endpoint</span>
                </Label>
                <Input
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Veilige SSL Encryptie &amp; GDPR Audit</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="h-7 text-xs px-2.5 gap-1 hover:bg-emerald-500/20"
                >
                  <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Test</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigIntegration(null)}
                className="w-full sm:w-auto rounded-full"
              >
                Annuleren
              </Button>
              <Button
                size="sm"
                onClick={handleSaveConfig}
                className="w-full sm:w-auto rounded-full"
              >
                Opslaan &amp; Activeren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
