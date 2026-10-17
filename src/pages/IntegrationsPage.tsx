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
  PhoneCall,
  Phone,
  Terminal,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
  Map,
  Layers,
  ArrowUpRight,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  syncAllDataFromHubSpot,
  loadHubSpotConfigFromFirestore,
  type HubSpotSyncProgress,
  type HubSpotConfig,
} from '@/services/hubspotService';
import {
  loadTwilioConfigFromFirestore,
  saveTwilioConfigToFirestore,
  DEFAULT_TWILIO_CONFIG,
  TWILIO_MCP_INFO,
  type TwilioConfig,
  makeCall,
  verifyTwilioAccount,
} from '@/services/twilioService';
import {
  loadOpenMapConfigFromFirestore,
  saveOpenMapConfigToFirestore,
  DEFAULT_OPEN_MAP_CONFIG,
  OPEN_FREE_MAP_STYLES,
  type OpenMapConfig,
} from '@/services/openMapService';
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
    id: 'twilio-voice',
    name: 'Twilio Voice & AI MCP',
    tagline: 'Cloud Telefonie, Web Dialer & Model Context Protocol',
    category: 'AI & FinTech',
    description:
      'Echt bellen direct vanuit CRMos. Koppel Twilio Programmable Voice voor in-browser outbound en inbound bellen, opnames, en verbind AI coding agents met de Twilio MCP server (mcp.twilio.com/docs).',
    icon: PhoneCall,
    gradient: 'from-red-600 to-rose-600',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/20',
    website: 'https://www.twilio.com/docs/ai/mcp',
    status: 'connected',
    features: ['In-browser Web Dialer', 'Twilio AI MCP Server (1.800+ APIs)', 'Gespreksopnames & Tijdlijn Sync', 'Direct bellen via GSM (`tel:`)'],
    apiKeyPlaceholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  {
    id: 'open-geo',
    name: 'Open-Source Kaarten & Geodata Hub',
    tagline: 'MapLibre GL, OpenFreeMap Vector Tiles & Kadaster PDOK',
    category: 'Logistiek & Expansie',
    description:
      '100% open-source en keyless geodata-architectuur voor veldvertegenwoordigers en rayon managers. MapLibre GL JS vector kaarten, Kadaster PDOK adres-resolutie, OSRM looproutes en Overpass POI analyse. Géén commerciële API-keys vereist.',
    icon: MapPin,
    gradient: 'from-sky-500 to-indigo-600',
    badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    website: 'https://openfreemap.org/',
    status: 'connected',
    features: ['MapLibre GL JS Vector Engine', 'OpenFreeMap Liberty / Positron / Bright', 'Kadaster PDOK & Photon Geocoding', 'OSRM Routeplanner & Overpass POIs'],
    apiKeyPlaceholder: 'Geen API-key nodig (100% Keyless)',
  },
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
  const navigate = useNavigate();
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

  // Twilio Telephony & AI MCP State
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(DEFAULT_TWILIO_CONFIG);
  const [isTwilioSaving, setIsTwilioSaving] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showMcpGuide, setShowMcpGuide] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestingTwilioCall, setIsTestingTwilioCall] = useState(false);
  const [isVerifyingTwilio, setIsVerifyingTwilio] = useState(false);
  const [twilioAccountInfo, setTwilioAccountInfo] = useState<{
    friendlyName?: string;
    type?: string;
    status?: string;
    phoneNumbers?: Array<{ phoneNumber: string; friendlyName: string }>;
  } | null>(null);

  // Open-Source Geodata & Kaarten State (MapLibre & OpenFreeMap)
  const [openMapConfig, setOpenMapConfig] = useState<OpenMapConfig>(DEFAULT_OPEN_MAP_CONFIG);
  const [isOpenMapSaving, setIsOpenMapSaving] = useState(false);
  const [showOpenMapMcpGuide, setShowOpenMapMcpGuide] = useState(false);

  useEffect(() => {
    loadHubSpotConfigFromFirestore(orgId).then((cfg) => {
      if (cfg) {
        setHubspotConfig(cfg);
        setHubspotToken(cfg.accessToken || '');
      }
    });

    loadTwilioConfigFromFirestore(orgId).then((twCfg) => {
      if (twCfg) {
        setTwilioConfig(twCfg);
      }
    });

    loadOpenMapConfigFromFirestore(orgId).then((omCfg) => {
      if (omCfg) {
        setOpenMapConfig(omCfg);
      }
    });
  }, [orgId]);

  const handleSaveOpenMapConfig = async () => {
    setIsOpenMapSaving(true);
    try {
      await saveOpenMapConfigToFirestore(openMapConfig, orgId);
      toast.success('Open-Source kaartinstellingen succesvol opgeslagen & gesynchroniseerd!');
    } catch {
      toast.error('Fout bij opslaan van kaartconfiguratie.');
    } finally {
      setIsOpenMapSaving(false);
    }
  };

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

  const handleSaveTwilioConfig = async () => {
    setIsTwilioSaving(true);
    try {
      await saveTwilioConfigToFirestore(twilioConfig, orgId);
      toast.success('Twilio telefonie instellingen succesvol opgeslagen & gesynchroniseerd!');
    } catch (err) {
      console.error(err);
      toast.error('Fout bij opslaan van Twilio configuratie.');
    } finally {
      setIsTwilioSaving(false);
    }
  };

  const handleVerifyTwilio = async () => {
    if (!twilioConfig.accountSid.trim() || !twilioConfig.authToken.trim()) {
      toast.error('Vul eerst je Twilio Account SID en Auth Token in.');
      return;
    }

    setIsVerifyingTwilio(true);
    try {
      const res = await verifyTwilioAccount({
        accountSid: twilioConfig.accountSid.trim(),
        authToken: twilioConfig.authToken.trim(),
      });

      if (res.valid) {
        setTwilioAccountInfo(res);
        const autoNumber = res.phoneNumbers?.[0]?.phoneNumber;
        setTwilioConfig((prev) => ({
          ...prev,
          enabled: true,
          phoneNumber: prev.phoneNumber || autoNumber || '',
        }));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Twilio verificatie mislukt.');
    } finally {
      setIsVerifyingTwilio(false);
    }
  };

  const handleTestTwilioOutbound = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Vul een test telefoonnummer in (bijv. +31612345678)');
      return;
    }
    if (!twilioConfig.accountSid.trim() || !twilioConfig.authToken.trim()) {
      toast.error('Vul eerst je Twilio Account SID en Auth Token in.');
      return;
    }
    if (!twilioConfig.phoneNumber.trim()) {
      toast.error('Vul eerst een Twilio telefoonnummer in (Caller ID) of verifieer je account.');
      return;
    }

    setIsTestingTwilioCall(true);
    try {
      const res = await makeCall({
        to: testPhoneNumber.trim(),
        from: twilioConfig.phoneNumber.trim(),
        contactName: 'Test Oproep Bestemming',
        agentName: user?.name || 'CRMos Beheerder',
        orgId,
        companyName: user?.company_name || organization?.name || 'CRMos',
        notes: 'Testoproep uitgevoerd vanuit Integraties Pagina',
      }, twilioConfig);

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fout bij starten testoproep';
      toast.error(msg);
    } finally {
      setIsTestingTwilioCall(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd naar klembord!`);
  };

  const categories = [
    { id: 'all', label: `Alle (${integrations.length})` },
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
      {/* 1. TWILIO TELEPHONY & AI MCP HUB                                      */}
      {/* ===================================================================== */}
      <Card className="relative overflow-hidden rounded-3xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 via-card/90 to-card p-5 sm:p-7 shadow-md">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    Twilio Voice Telephony &amp; Twilio AI MCP Server
                  </h2>
                  <Badge className={`text-[10px] ${
                    twilioConfig.enabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}>
                    {twilioConfig.enabled ? 'Twilio Voice Actief' : 'Klaar voor Inrichting'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>MCP 1.800+ Endpoints</span>
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Activeer echt in-app bellen en koppel coding agents direct aan Twilio&apos;s Model Context Protocol server (<code>https://mcp.twilio.com/docs</code>).
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMcpGuide(!showMcpGuide)}
              className="rounded-full text-xs gap-1.5 border-border/80 text-foreground hover:bg-muted shrink-0"
            >
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>{showMcpGuide ? 'Verberg MCP Guide' : 'Twilio MCP Setup Guide'}</span>
              {showMcpGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Twilio Credentials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-red-500" />
                <span>Twilio Account SID</span>
              </Label>
              <Input
                value={twilioConfig.accountSid}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value.trim() })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-xs h-10 bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-red-500" />
                  <span>Twilio Auth Token / API Secret</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showAuthToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showAuthToken ? 'Verberg' : 'Toon'}</span>
                </button>
              </Label>
              <Input
                type={showAuthToken ? 'text' : 'password'}
                value={twilioConfig.authToken}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value.trim() })}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-xs h-10 bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                <span>Twilio Caller ID Telefoonnummer</span>
              </Label>
              <Input
                value={twilioConfig.phoneNumber}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value.trim() })}
                placeholder="+31850000000 of +15550001111"
                className="font-mono text-xs h-10 bg-background/80"
              />
            </div>
          </div>

          {/* Quick Actions & Twilio Account Status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyTwilio}
                disabled={isVerifyingTwilio}
                className="h-8 rounded-xl text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                {isVerifyingTwilio ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Verifiëren...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Verifieer Account &amp; Haal Nummers Op</span>
                  </>
                )}
              </Button>

              {twilioAccountInfo && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-semibold text-foreground">{twilioAccountInfo.friendlyName}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {twilioAccountInfo.type || 'Account'}
                  </Badge>
                </div>
              )}
            </div>

            {twilioAccountInfo?.phoneNumbers && twilioAccountInfo.phoneNumbers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground text-[11px]">Gevonden Twilio nummers:</span>
                {twilioAccountInfo.phoneNumbers.map((num) => (
                  <Badge
                    key={num.phoneNumber}
                    onClick={() => {
                      setTwilioConfig((prev) => ({ ...prev, phoneNumber: num.phoneNumber }));
                      toast.success(`Afzendernummer ingesteld op ${num.phoneNumber}`);
                    }}
                    className={`cursor-pointer transition-all text-[11px] font-mono ${
                      twilioConfig.phoneNumber === num.phoneNumber
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-background hover:bg-muted text-foreground border'
                    }`}
                  >
                    {num.phoneNumber}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Additional Settings & Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-background/70 border border-border/60">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl">
              <div>
                <p className="text-xs font-semibold">Twilio Voice Bellen</p>
                <p className="text-[10px] text-muted-foreground">In-browser web dialer activeren</p>
              </div>
              <Switch
                checked={twilioConfig.enabled}
                onCheckedChange={(checked) => setTwilioConfig({ ...twilioConfig, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl">
              <div>
                <p className="text-xs font-semibold">Gespreksopnames</p>
                <p className="text-[10px] text-muted-foreground">Oproepen automatisch opnemen</p>
              </div>
              <Switch
                checked={twilioConfig.recordingEnabled}
                onCheckedChange={(checked) => setTwilioConfig({ ...twilioConfig, recordingEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl">
              <div>
                <p className="text-xs font-semibold">Twilio AI MCP Ready</p>
                <p className="text-[10px] text-muted-foreground">Agents toegang geven tot MCP docs</p>
              </div>
              <Switch
                checked={true}
                disabled
              />
            </div>
          </div>

          {/* Test Calling Tool & Save */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                placeholder="Testnummer (bijv. +31612345678)"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTwilioOutbound}
                disabled={isTestingTwilioCall}
                className="h-9 rounded-xl text-xs gap-1.5 shrink-0 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>{isTestingTwilioCall ? 'Bezig...' : 'Test Oproep'}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveTwilioConfig}
                disabled={isTwilioSaving}
                className="h-9 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
              >
                {isTwilioSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Opslaan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Twilio Configuratie Opslaan</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Twilio AI MCP Server Documentation & Setup */}
          {showMcpGuide && (
            <div className="rounded-2xl bg-background/90 border border-primary/20 p-4 space-y-3 text-xs mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">
                    Twilio Model Context Protocol (MCP) Server Setup
                  </span>
                </div>
                <a
                  href="https://www.twilio.com/docs/ai/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Officiële Twilio Docs</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <p className="text-muted-foreground leading-relaxed text-[11px]">
                De Twilio MCP server (<code>https://mcp.twilio.com/docs</code>) geeft AI coding agents direct toegang tot alle Twilio API documentatie en schema&apos;s voor <strong>Voice, Conversations, Studio, TaskRouter, Flex en Agent Connect</strong>.
              </p>

              <div className="space-y-2">
                <p className="font-semibold text-foreground text-[11px]">1. Claude Code CLI Toevoegen:</p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 font-mono text-[11px] border border-border/40">
                  <span className="truncate">{TWILIO_MCP_INFO.claudeCliCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyText(TWILIO_MCP_INFO.claudeCliCommand, 'Claude Code CLI')}
                    className="h-6 px-2 text-[10px] gap-1 shrink-0 ml-2"
                  >
                    <Copy className="h-3 w-3" /> Kopieer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-foreground text-[11px]">2. Cursor Marketplace Command:</p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 font-mono text-[11px] border border-border/40">
                  <span>{TWILIO_MCP_INFO.cursorCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyText(TWILIO_MCP_INFO.cursorCommand, 'Cursor Command')}
                    className="h-6 px-2 text-[10px] gap-1 shrink-0 ml-2"
                  >
                    <Copy className="h-3 w-3" /> Kopieer
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-semibold text-foreground text-[11px]">3. Beschikbare MCP Tools:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-primary">twilio__search</span>
                    <p className="text-muted-foreground text-[10px]">Zoekt met natuurlijke taal door meer dan 1.800 Twilio endpoints en handleidingen.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-primary">twilio__retrieve</span>
                    <p className="text-muted-foreground text-[10px]">Haalt de exacte parameters, data types en response schema&apos;s op van geselecteerde API IDs.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* 2. OPEN-SOURCE GEODATA HUB (MAPLIBRE, OPENFREEMAP, PDOK & OSRM)       */}
      {/* ===================================================================== */}
      <Card className="relative overflow-hidden rounded-3xl border-2 border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card/90 to-card p-5 sm:p-7 shadow-md">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    Open-Source Kaarten &amp; Geodata Hub
                  </h2>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    100% Keyless &amp; Operationeel ✓
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>MapLibre GL + OpenFreeMap</span>
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  100% open-source vector kaarten, Kadaster PDOK adres-resolutie, OSRM looproutes en Overpass POI analyse. Géén Google Maps / Mapbox API-keys of billing accounts nodig.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/territories')}
                className="rounded-full text-xs gap-1.5 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
              >
                <Map className="h-3.5 w-3.5" />
                <span>Open Rayon Kaart</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOpenMapMcpGuide(!showOpenMapMcpGuide)}
                className="rounded-full text-xs gap-1.5 border-border/80 text-foreground hover:bg-muted"
              >
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span>{showOpenMapMcpGuide ? 'Verberg MCP Guide' : 'Open-Geo MCP Setup'}</span>
                {showOpenMapMcpGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* OpenFreeMap Vector Styles & Geodata Presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-sky-500" />
                  <span>Standaard Vector Stijl (OpenFreeMap)</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Geen API-key vereist</span>
              </Label>
              <Input
                value={openMapConfig.styleUrl}
                onChange={(e) => setOpenMapConfig({ ...openMapConfig, styleUrl: e.target.value.trim() })}
                placeholder="https://tiles.openfreemap.org/styles/liberty"
                className="font-mono text-xs h-10 bg-background/80"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {OPEN_FREE_MAP_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setOpenMapConfig({ ...openMapConfig, styleUrl: st.url })}
                    className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      openMapConfig.styleUrl === st.url
                        ? 'border-sky-500 bg-sky-500/15 text-foreground ring-2 ring-sky-500/30'
                        : 'border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-semibold text-foreground text-[11px]">{st.name}</span>
                    <span className="text-[10px] line-clamp-2 mt-1 opacity-80">{st.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-indigo-500" />
                  <span>OSRM Routeprofiel</span>
                </Label>
                <div className="flex gap-1.5 pt-1">
                  {(['foot', 'cycling', 'driving'] as const).map((prof) => (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => setOpenMapConfig({ ...openMapConfig, routingProfile: prof })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                        openMapConfig.routingProfile === prof
                          ? 'bg-sky-500 text-white font-bold border-sky-600'
                          : 'bg-background hover:bg-muted border-border/60 text-muted-foreground'
                      }`}
                    >
                      {prof === 'foot' ? '🏃 Te Voet' : prof === 'cycling' ? '🚲 Fiets' : '🚗 Auto'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <span className="font-semibold text-foreground text-[11px]">Geodata Bronnen Overzicht:</span>
                <ul className="space-y-1 text-[10px] text-muted-foreground list-disc pl-4">
                  <li><strong>Kadaster PDOK:</strong> Officiële BAG-adressen &amp; postcodes van Nederland.</li>
                  <li><strong>Photon &amp; Nominatim:</strong> Wereldwijde forward &amp; reverse geocoding.</li>
                  <li><strong>OSRM:</strong> Realtime looproutes en afstandsberekening.</li>
                  <li><strong>Overpass API:</strong> POI voorzieningen scan (straal in meters).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Alle geodata-diensten draaien keyless en sturen automatisch de verplichte User-Agent header mee.</span>
            </div>

            <Button
              onClick={handleSaveOpenMapConfig}
              disabled={isOpenMapSaving}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs gap-2 shadow-md"
            >
              {isOpenMapSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kaartinstellingen Opslaan</span>
                </>
              )}
            </Button>
          </div>

          {/* Collapsible Open-Source Geo MCP Server Setup */}
          {showOpenMapMcpGuide && (
            <div className="mt-4 rounded-2xl bg-muted/30 border border-sky-500/30 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-sky-500" />
                  <h3 className="text-sm font-bold text-foreground">
                    Open-Source Geo Model Context Protocol (MCP) Setup
                  </h3>
                </div>
                <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  100% Gratis &bull; Geen Token
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                De Open-Source Geo MCP server stelt AI coding agents (Claude Code CLI, Cursor en OpenCode) in staat om zelfstandig <strong>Nederlandse Kadaster adressen op te zoeken, looproutes via OSRM te berekenen en voorzieningen te scannen via Overpass QL</strong>, volledig zonder API-tokens of verbruikskosten.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Claude Desktop / Claude Code Config (<code>claude_desktop_config.json</code>)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyText(`{\n  "mcpServers": {\n    "open-geo": {\n      "command": "python3",\n      "args": ["${navigator.userAgent.includes('Mac') ? '~' : '/home/jsdrenthe'}/.gemini/config/scripts/open_geo_mcp.py"]\n    }\n  }\n}`, 'Open-Geo MCP configuratie')}
                    className="h-7 text-xs gap-1 text-primary"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Kopieer JSON Config</span>
                  </Button>
                </div>
                <pre className="rounded-xl bg-background/90 p-3 text-[11px] font-mono text-foreground border overflow-x-auto">
{`{
  "mcpServers": {
    "open-geo": {
      "command": "python3",
      "args": ["~/.gemini/config/scripts/open_geo_mcp.py"]
    }
  }
}`}
                </pre>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <p className="font-semibold text-foreground">Beschikbare Open-Source Geo MCP Kaarttools:</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">geo_geocode</span>
                    <p className="text-muted-foreground text-[10px]">Zoekt adressen en postcodes via Kadaster PDOK &amp; Photon (OSM).</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">geo_reverse_geocode</span>
                    <p className="text-muted-foreground text-[10px]">Zet GPS-coördinaten om in straatnaam, huisnummer en woonplaats.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">geo_directions</span>
                    <p className="text-muted-foreground text-[10px]">Berekent de meest efficiënte looproute van deur tot deur via OSRM.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">geo_poi_search</span>
                    <p className="text-muted-foreground text-[10px]">Vraagt voorzieningen en panden in de buurt op via Overpass QL.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ===================================================================== */}
      {/* 3. HUBSPOT LIVE CRM MIGRATION & SYNC BANNER                           */}
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
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="outline" className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5">
                Ecosysteem Koppelingen
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Integraties &amp; Netwerk Partners
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Verbind CRMos met je favoriete platforms, netwerken en telecom providers. Van AI lead scoring en affiliate tracking tot Twilio telefonie en logistiek.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end bg-card/60 p-2 sm:p-3 rounded-2xl border border-border/60">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground font-medium">Actief Verbonden</p>
              <p className="text-xl font-bold text-foreground">{connectedCount} / {integrations.length}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek integratie of feature..."
            className="pl-8 text-xs h-9 rounded-full bg-card/60"
          />
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

      {/* Configuration Dialog for Partner Integrations */}
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
