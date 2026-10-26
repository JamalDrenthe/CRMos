import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  Lock,
  Database,
  CheckCircle2,
  RefreshCw,
  Blocks,
  Mail,
  Phone,
  Clock,
  LogOut,
  Trash2,
  ShieldCheck,
  Layers,
  Globe,
  Users2,
  Key,
  Tag,
  Copy,
  ExternalLink,
  Hash,
  Plus,
  X,
  UserPlus,
} from 'lucide-react';
import { isCoreEcosystemCompany } from '@/types';
import { CORE_PARTNER_OPTIONS, formatCompanyTag } from '@/lib/companyAccess';
import { seedDemoDataToFirestore, purgeDemoAndMockDataFromFirestore } from '@/services/firestoreService';
import { syncVvcRecordToCloud } from '@/services/vvcTagService';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();
  const {
    contacts,
    companies,
    addContact,
    updateContact,
    addCompanyTagToContact,
    removeCompanyTagFromContact,
    acceptCompanyInvitation,
    clearLocalStore: clearCRM,
  } = useCRMStore();

  const [newCompanyTagInput, setNewCompanyTagInput] = useState('');

  const cleanUserSeed = (user?.id || user?.email?.split('@')[0] || 'user1')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const profileVvcTag = user?.vvc_tag || `vvc-usr-${cleanUserSeed}`;

  const linkedCrmContact = contacts.find(
    (c) =>
      c.id === `contact_usr_${user?.id}` ||
      (user?.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
      (c.vvc_tag && c.vvc_tag.toLowerCase() === profileVvcTag.toLowerCase())
  );

  const defaultUserCompanyTag = formatCompanyTag(user?.company_name || 'CRMos');
  const activeCompanyTags = Array.from(
    new Set([
      defaultUserCompanyTag,
      ...(user?.company_tags || []),
      ...(linkedCrmContact?.company_tags || []),
      ...(linkedCrmContact?.tags || []).filter((t) => t.startsWith('#')),
    ])
  ).filter(Boolean);

  const accountInvitations = [
    ...(linkedCrmContact?.company_invitations || []),
    ...(user?.company_invitations || []).filter(
      (inv) => !(linkedCrmContact?.company_invitations || []).some((ci) => ci.id === inv.id)
    ),
  ];

  const handleAddAccountCompanyTag = (rawTag: string) => {
    const formatted = formatCompanyTag(rawTag);
    if (!formatted || formatted === '#') {
      toast.error('Voer een geldige bedrijfstag in (bijv. #spontiva of #vvc)');
      return;
    }
    const nextTags = Array.from(new Set([...activeCompanyTags, formatted]));
    updateUser({ company_tags: nextTags });

    if (linkedCrmContact) {
      addCompanyTagToContact(linkedCrmContact.id, formatted);
    }
    setNewCompanyTagInput('');
    toast.success(`Bedrijfstag ${formatted} toegevoegd aan je account & CRM profiel!`);
  };

  const handleRemoveAccountCompanyTag = (tagToRemove: string) => {
    const nextTags = activeCompanyTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    updateUser({ company_tags: nextTags });
    if (linkedCrmContact) {
      removeCompanyTagFromContact(linkedCrmContact.id, tagToRemove);
    }
    toast.info(`Bedrijfstag ${tagToRemove} verwijderd van je profiel`);
  };

  const handleAcceptInvitation = (invitationId: string, companyNameForToast: string) => {
    if (linkedCrmContact) {
      acceptCompanyInvitation(linkedCrmContact.id, invitationId);
    }
    const updatedUserInvites = (user?.company_invitations || []).map((inv) =>
      inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
    );
    updateUser({ company_invitations: updatedUserInvites });
    toast.success(`Uitnodiging van ${companyNameForToast} geaccepteerd! Je bent nu gekoppeld als medewerker.`);
  };

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || 'Jamal');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || 'Drenthe');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'info@jamaldrenthe.com');
  const [profilePhone, setProfilePhone] = useState(linkedCrmContact?.phone || '+31 6 12345678');
  const [profileTimezone, setProfileTimezone] = useState(user?.timezone || 'Europe/Amsterdam');

  const [companyName, setCompanyName] = useState(user?.company_name || 'CRMos');
  const [kvkNumber, setKvkNumber] = useState('84920114');
  const [btwNumber, setBtwNumber] = useState('NL84920114B01');
  const [orgType, setOrgType] = useState('hybrid');
  const [allowedCompaniesInput, setAllowedCompaniesInput] = useState((user?.allowed_companies || []).join(', '));

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (user?.email) {
      setProfileEmail(user.email);
    }
    if (user?.company_name) {
      setCompanyName(user.company_name);
    }
    if (user?.allowed_companies) {
      setAllowedCompaniesInput(user.allowed_companies.join(', '));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'CRMos Gebruiker';
    updateUser({
      name: fullName,
      email: profileEmail.trim(),
      timezone: profileTimezone,
      vvc_tag: profileVvcTag,
    });

    if (linkedCrmContact) {
      updateContact(linkedCrmContact.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        company: user?.company_name || companyName,
        vvc_tag: profileVvcTag,
        tags: Array.from(new Set([profileVvcTag, ...(linkedCrmContact.tags || []), 'Aanmelding', 'CRMos Profiel'])),
      });
    } else if (user) {
      addContact({
        id: `contact_usr_${user.id}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        company: user.company_name || companyName,
        title: user.role || 'admin',
        status: 'partner',
        source: 'CRMos Account Aanmelding',
        vvc_tag: profileVvcTag,
        tags: [profileVvcTag, 'Aanmelding', 'CRMos Profiel'],
        custom_fields: { user_id: user.id, registration_type: 'account', vvc_tag: profileVvcTag },
      });
    }

    await syncVvcRecordToCloud({
      vvc_tag: profileVvcTag,
      registration_type: 'account',
      entity_id: linkedCrmContact?.id || `contact_usr_${user?.id || 'user1'}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName,
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
      company: user?.company_name || companyName,
      role: user?.role || 'admin',
      status: 'active',
      source: 'CRMos Profiel & Contact',
      org_id: user?.org_id || 'default_org',
      created_at: user?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    toast.success(`Profiel én gekoppeld CRM Contact (${profileVvcTag}) succesvol bijgewerkt!`);
  };

  const isCorePartner = isCoreEcosystemCompany(user?.company_name);
  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const handleSaveOrganization = () => {
    const trimmedCompany = companyName.trim() || 'CRMos';
    const parsedAllowed = allowedCompaniesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateUser({
      company_name: trimmedCompany,
      allowed_companies: parsedAllowed.length > 0 ? parsedAllowed : undefined,
    });
    toast.success(`Bedrijfsprofiel voor ${trimmedCompany} succesvol opgeslagen`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('Log out') + ' succesvol');
      navigate('/login');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  const tabFromUrl = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'integrations', 'organization', 'data', 'security', 'notifications', 'appearance'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const { clearLocalStore: clearRec } = useRecruitmentStore();
  const { clearLocalStore: clearCC } = useContactCenterStore();

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    const orgId = user?.org_id || 'default_org';
    try {
      const res = await seedDemoDataToFirestore(orgId);
      if (res.success) {
        toast.success(`Succesvol ${res.count} demorecords ingeladen voor Field Sales, Callcenter en Recruitment!`);
      } else {
        toast.info('Voorbeelddata lokaal beschikbaar (Firestore offline of ongeconfigureerd)');
      }
    } catch {
      toast.error('Er is een fout opgetreden bij het inladen van de demodata');
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePurgeMockData = async () => {
    const orgId = user?.org_id || 'default_org';
    clearCRM();
    clearRec();
    clearCC();
    const deleted = await purgeDemoAndMockDataFromFirestore(orgId);
    toast.success(`Alle mock & demo data is gewist (${deleted} records uit Cloud verwijderd).`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================================================================== */}
      {/* APPLE ID / ACCOUNT CENTRUM PROFILE BANNER */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-border/60 bg-gradient-to-r from-card/90 via-card/60 to-muted/30 p-5 sm:p-7 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 shadow-md">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl sm:text-2xl">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user?.name || 'Jamal Drenthe'}
                </h1>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold uppercase">
                  {user?.role || 'admin'}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profileVvcTag);
                    toast.success(`VVC Profiel Tag gekopieerd: ${profileVvcTag}`);
                  }}
                  title="Klik om je persoonlijke VVC API Tag te kopiëren"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer group"
                >
                  <Tag className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>{profileVvcTag}</span>
                  <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {user?.email || 'info@jamaldrenthe.com'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground font-mono">
                <span>Bedrijf: <strong className="text-foreground">{user?.company_name || 'CRMos'}</strong></span>
                <span>•</span>
                {isCorePartner ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium py-0">
                    Core Ecosysteem
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-500 border-indigo-500/30 font-medium py-0">
                    Geïsoleerde Omgeving
                  </Badge>
                )}
                <span>•</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Opgeslagen als CRM Contact
                </span>
              </div>
              {activeCompanyTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Bedrijfstags:</span>
                  {activeCompanyTags.map((ct) => (
                    <Badge
                      key={ct}
                      variant="outline"
                      className="text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 py-0 px-2"
                    >
                      {ct}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTabChange('integrations')}
              className="rounded-full text-xs gap-1.5 h-8 flex-1 sm:flex-none"
            >
              <Blocks className="h-3.5 w-3.5 text-primary" />
              <span>9 Integraties Beschikbaar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleTabChange('data')}
              className="rounded-full text-xs gap-1 h-8 text-muted-foreground hover:text-foreground flex-1 sm:flex-none"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Firestore Status</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="rounded-full text-xs gap-1.5 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 flex-1 sm:flex-none font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              <span>{t('Log out')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ACCOUNT CENTRUM TABS NAVIGATION (MOBILE SCROLLABLE) */}
      {/* ===================================================================== */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-full bg-muted/60 p-1 border border-border/50 backdrop-blur-md">
            <TabsTrigger
              value="profile"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profiel</span>
            </TabsTrigger>

            <TabsTrigger
              value="integrations"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Blocks className="h-3.5 w-3.5 text-primary" />
              <span>Integraties</span>
              <span className="ml-1 rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                9
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="organization"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Organisatie</span>
            </TabsTrigger>

            <TabsTrigger
              value="data"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Data &amp; Cloud</span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Beveiliging</span>
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Meldingen</span>
            </TabsTrigger>

            <TabsTrigger
              value="appearance"
              className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Weergave</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: PROFILE */}
        {/* ===================================================================== */}
        <TabsContent value="profile" className="space-y-5 animate-in fade-in duration-200">
          {/* VVC API Tag & CRM Contact Koppeling Card in Profile */}
          <Card className="rounded-3xl border-amber-500/30 bg-amber-500/[0.04] backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <span>Unieke VVC API Tag &amp; CRM Contactprofiel</span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                        Actief Gekoppeld
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Bij aanmelding zijn jouw gegevens direct opgeslagen als Contact in het CRM met onderstaande unieke VVC-tag standaard gekoppeld.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      linkedCrmContact
                        ? `/crm/contacts?id=${linkedCrmContact.id}`
                        : '/crm/contacts'
                    )
                  }
                  className="rounded-full text-xs gap-1.5 h-8 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-amber-500" />
                  <span>Bekijk in CRM Contacten</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-background/80 border border-amber-500/25">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Jouw Persoonlijke VVC API Tag (Profiel &amp; CRM Contact)
                  </span>
                  <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400">
                    <Tag className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{profileVvcTag}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(profileVvcTag);
                      toast.success(`VVC API Tag gekopieerd: ${profileVvcTag}`);
                    }}
                    className="rounded-xl text-xs h-9 px-3.5 gap-1.5 border-amber-500/30 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Kopieer VVC Tag</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground px-1">
                <span>
                  Standaard tags op jouw CRM Contact:{' '}
                  <strong className="font-mono text-foreground">{profileVvcTag}</strong>,{' '}
                  <strong className="text-foreground">Aanmelding</strong>,{' '}
                  <strong className="text-foreground">CRMos Profiel</strong>
                </span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  GET /api/vvc/lookup?tag={profileVvcTag}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Mijn Bedrijfstags & Bedrijfsuitnodigingen Card */}
          <Card className="rounded-3xl border-sky-500/30 bg-sky-500/[0.04] backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    <Hash className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <span>Mijn Bedrijfstags &amp; Medewerker-Vindbaarheid</span>
                      <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[11px]">
                        {activeCompanyTags.length} {activeCompanyTags.length === 1 ? 'Tag Actief' : 'Tags Actief'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Voeg bedrijfstags toe aan je account zodat bedrijven in het CRM (zoals VVC, Spontiva, Investbotiq, etc.) jou via zoeken kunnen terugvinden en uitnodigen om bij hun bedrijf te komen.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/crm/companies')}
                  className="rounded-full text-xs gap-1.5 h-8 border-sky-500/30 hover:bg-sky-500/10"
                >
                  <Building2 className="h-3.5 w-3.5 text-sky-500" />
                  <span>Naar Bedrijvenoverzicht</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
              {/* Huidige Bedrijfstags op Account */}
              <div className="p-3.5 rounded-2xl bg-background/80 border border-sky-500/25 space-y-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Jouw Actieve Bedrijfstags (Zichtbaar voor Bedrijven bij Medewerkers Zoeken)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeCompanyTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 py-1 px-2.5 flex items-center gap-1.5"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccountCompanyTag(tag)}
                        title={`Verwijder ${tag}`}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Nieuwe Bedrijfstag Handmatig Toevoegen */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={newCompanyTagInput}
                    onChange={(e) => setNewCompanyTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCompanyTagInput.trim()) {
                        e.preventDefault();
                        handleAddAccountCompanyTag(newCompanyTagInput);
                      }
                    }}
                    placeholder="Voeg een bedrijfstag toe (bijv. #spontiva, #investbotiq, #vvc of eigen bedrijfsnaam)..."
                    className="pl-8 h-9 text-xs rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddAccountCompanyTag(newCompanyTagInput)}
                  className="rounded-xl h-9 px-4 text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Bedrijfstag Toevoegen</span>
                </Button>
              </div>

              {/* Snelkiezer: Alle 13 CRMos Ecosysteem Bedrijven + Toegevoegde CRM Bedrijven */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Snel toevoegen vanuit geregistreerde CRM Bedrijven ({companies.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {companies.slice(0, 20).map((comp) => {
                    const compTag = comp.company_tag || formatCompanyTag(comp.name);
                    const isAdded = activeCompanyTags.some((t) => t.toLowerCase() === compTag.toLowerCase());
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            handleRemoveAccountCompanyTag(compTag);
                          } else {
                            handleAddAccountCompanyTag(compTag);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-semibold shadow-2xs'
                            : 'bg-background/70 text-muted-foreground border-border/60 hover:border-sky-500/40 hover:text-foreground'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-sky-500">{compTag}</span>
                        <span>({comp.name})</span>
                        {isAdded ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Plus className="h-3 w-3 opacity-60 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Openstaande & Geaccepteerde Bedrijfsuitnodigingen */}
              {accountInvitations.length > 0 && (
                <div className="pt-2 border-t border-sky-500/20 space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Bedrijfsuitnodigingen voor jouw account ({accountInvitations.length})</span>
                  </span>
                  <div className="grid gap-2">
                    {accountInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-background/90 border border-border/60"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{inv.company_name}</span>
                            <Badge variant="outline" className="font-mono text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                              {inv.company_tag}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                inv.status === 'accepted'
                                  ? 'text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }
                            >
                              {inv.status === 'accepted' ? 'Lid / Medewerker' : 'Uitgenodigd'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Rol: <strong className="text-foreground">{inv.role || 'Medewerker'}</strong> • Uitgenodigd door {inv.invited_by_name}
                          </p>
                        </div>
                        {inv.status !== 'accepted' ? (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvitation(inv.id, inv.company_name)}
                            className="rounded-full h-8 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Uitnodiging Accepteren</span>
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aangesloten bij bedrijf
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">Persoonlijke Gegevens</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Beheer je naam, e-mailadres en contactinformatie. Wijzigingen worden direct gesynchroniseerd met je CRM Contact en VVC API Tag.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Voornaam</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Achternaam</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>E-mailadres</span>
                  </Label>
                  <Input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Telefoonnummer</span>
                  </Label>
                  <Input
                    placeholder="+31 6 12345678"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-amber-500" />
                    <span>Standaard VVC Tag (Profiel &amp; Contact)</span>
                  </Label>
                  <Input
                    value={profileVvcTag}
                    readOnly
                    className="h-9 text-xs font-mono bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Tijdzone</span>
                  </Label>
                  <select
                    value={profileTimezone}
                    onChange={(e) => setProfileTimezone(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                  >
                    <option value="Europe/Amsterdam">Europa / Amsterdam (CET/CEST)</option>
                    <option value="Europe/London">Londen (GMT/BST)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveProfile} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Wijzigingen Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessie & Toegang Card in Profile Tab */}
          <Card className="rounded-3xl border-red-500/20 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <LogOut className="h-5 w-5 text-red-500" />
                <span>Sessie &amp; Toegang</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Beheer je actieve aanmelding op dit apparaat of meld je direct af.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground">Huidige Sessie</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ingelogd als <strong className="text-foreground">{user?.email || 'info@jamaldrenthe.com'}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-full px-5 text-xs h-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 font-semibold gap-2"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>{t('Log out')}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 2: INTEGRATIES (ALL 9 OFFICIAL INTEGRATIONS) */}
        {/* ===================================================================== */}
        <TabsContent value="integrations" className="space-y-5 animate-in fade-in duration-200">
          <IntegrationsPage />
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 3: ORGANIZATION */}
        {/* ===================================================================== */}
        {/* ===================================================================== */}
        {/* TAB 3: ORGANIZATION & MULTI-TENANT ISOLATION */}
        {/* ===================================================================== */}
        <TabsContent value="organization" className="space-y-6 animate-in fade-in duration-200">
          {/* Card 1: Multi-Tenant Bedrijfscategorisatie & Data-Toegangsstatus */}
          <Card className={`rounded-3xl border ${
            isCorePartner
              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
              : 'border-indigo-500/30 bg-indigo-500/[0.04]'
          } backdrop-blur-xl shadow-xs overflow-hidden`}>
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${
                    isCorePartner
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-500/10 text-indigo-500'
                  }`}>
                    {isCorePartner ? <Layers className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <span>Bedrijfscategorisatie &amp; Toegangsstatus</span>
                      {isCorePartner ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                          CRMos Core Ecosysteem
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 text-xs">
                          Geïsoleerde Bedrijfsomgeving
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Multi-tenant isolatieregels en datatoegang binnen het CRMos platform.
                    </CardDescription>
                  </div>
                </div>

                {isSuperAdmin && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-xs px-2.5 py-1">
                    Master Admin Toezicht
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
              {isCorePartner ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-background/60 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Gedeelde Toegang tot Centrale CRMos Dataset
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Jouw account is geregistreerd onder <strong className="text-foreground">{user?.company_name || 'CRMos'}</strong>. Je hebt directe toegang tot de centrale CRMos dataset (waaronder 1.274 contacten, bedrijven en gesprekken uit HubSpot). Deze gegevens worden uitsluitend gedeeld tussen de 6 officiële CRMos kernpartners:
                      </p>
                    </div>
                  </div>

                  {/* 6 Core Ecosystem Partners Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {CORE_PARTNER_OPTIONS.map((partner) => {
                      const isCurrent = (user?.company_name || '').toLowerCase() === partner.toLowerCase();
                      return (
                        <div
                          key={partner}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                            isCurrent
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                              : 'bg-muted/40 border-border/50 text-foreground'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
                          <span className="truncate">{partner}</span>
                          {isCurrent && (
                            <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              (Jouw Bedrijf)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-muted-foreground italic pt-1">
                    * Externe bedrijven die zich via de registratie aanmelden hebben géén toegang tot deze kerngegevens en opereren in een strikt geïsoleerde tenant.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-indigo-500/20 bg-background/60 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Strikte Privacy &amp; Data-Isolatie Actief
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Jouw account is geregistreerd onder <strong className="text-foreground">{user?.company_name || 'Je Bedrijf'}</strong>. Alle data (klanten, deals, kandidaten, rayonbezoeken en belcampagnes) die door jouw team worden ingevoerd zijn strikt privé.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Lock className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Tenant Afscherming</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Andere bedrijven kunnen jouw gegevens onder geen beding zien of opvragen.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Users2 className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Team Autonomie</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Collega's binnen {user?.company_name || 'jouw bedrijf'} delen gezamenlijk de werkruimte.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Shield className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Platform Toezicht</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Platformbeheerders (Admin) bieden technische ondersteuning en audits.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 flex items-start gap-3">
                  <Key className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-foreground">Platform Master Administrator</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Als beheerder kun je alle bedrijfsdata inzien en via de bedrijfsfilter in de bovenbalk schakelen tussen Masterview, het CRMos Core ecosysteem of specifieke bedrijfstenants.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Bedrijfsprofiel & Administratieve Instellingen */}
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg font-bold">Bedrijfsprofiel &amp; Instellingen</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Beheer je bedrijfsnaam, branche en samenwerkingsrechten.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bedrijfsnaam</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="bijv. CRMos, VVC, of Bedrijfsnaam B.V."
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Bepaalt onder welke bedrijfsentiteit jouw data en teamleden worden gegroepeerd.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Type Organisatie</Label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                  >
                    <option value="sales_agency">Field Sales &amp; Deur-tot-deur Organisatie</option>
                    <option value="callcenter">Callcenter &amp; Telemarketing Bureau</option>
                    <option value="recruitment">Recruitment &amp; Uitzendbureau</option>
                    <option value="hybrid">Hybride Commerciële Onderneming</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Gekoppeld Zakelijk E-mail</span>
                  </Label>
                  <Input
                    value={user?.email || 'info@jamaldrenthe.com'}
                    disabled
                    className="h-9 text-xs bg-muted/40 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">KVK Nummer</Label>
                  <Input
                    value={kvkNumber}
                    onChange={(e) => setKvkNumber(e.target.value)}
                    placeholder="12345678"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">BTW Nummer</Label>
                  <Input
                    value={btwNumber}
                    onChange={(e) => setBtwNumber(e.target.value)}
                    placeholder="NL84920114B01"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Gedeelde Toegang (Multi-Company Sharing)</span>
                </Label>
                <Input
                  value={allowedCompaniesInput}
                  onChange={(e) => setAllowedCompaniesInput(e.target.value)}
                  placeholder="bijv. VVC, Quantum Initium, Trusting Work (kommagescheiden)"
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Specificeer partnerbedrijven die geselecteerde leads, kandidaten of campagnes met jouw organisatie mogen uitwisselen.
                </p>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveOrganization} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Bedrijfsgegevens Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 4: DATA & CLOUD */}
        {/* ===================================================================== */}
        <TabsContent value="data" className="space-y-5 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Google Cloud Firestore &amp; Voorbeelddata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cloud Firestore Actief &amp; Verbonden</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Project: <strong className="text-foreground">crmosone-dev</strong> • Organisatie ID: <strong className="text-foreground">{user?.org_id || 'default_org'}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Realtime synchronisatie voor Contacten, Deals, Rayonbezoeken, Belcampagnes en Kandidaten.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Blocks className="h-4 w-4 text-orange-500" />
                    <span>HubSpot CRM Live Synchronisatie &amp; Opschonen</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Koppel je HubSpot Private App Access Token in het tabblad <strong>Integraties</strong> om al je echte Contacten, Bedrijven, Deals, Gesprekken en Taken direct in CRMos te laden, of wis alle oude mock/voorbeelddata met één klik.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleTabChange('integrations')}
                    className="rounded-full gap-2 px-6 h-9 text-xs bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  >
                    <Blocks className="h-4 w-4" />
                    <span>Open HubSpot Importer</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePurgeMockData}
                    className="rounded-full gap-2 px-6 h-9 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Wis Alle Mock &amp; Demo Data</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSeedDemoData}
                    disabled={isSeeding}
                    className="rounded-full gap-2 px-5 h-9 text-xs text-muted-foreground"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
                    <span>{isSeeding ? 'Bezig...' : 'Optioneel: Laad NL Voorbeelddata'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 5: SECURITY */}
        {/* ===================================================================== */}
        <TabsContent value="security" className="space-y-5 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">Beveiliging &amp; Wachtwoord</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Huidig Wachtwoord</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nieuw Wachtwoord</Label>
                  <Input type="password" placeholder="Minimaal 8 tekens" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bevestig Nieuw Wachtwoord</Label>
                  <Input type="password" placeholder="Herhaal nieuw wachtwoord" className="h-9 text-xs" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">Tweeledige Verificatie (2FA)</p>
                    <p className="text-[11px] text-muted-foreground">Extra beveiliging via Authenticator app</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-2">
                <Button onClick={() => toast.success('Beveiligingsinstellingen bijgewerkt')} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Beveiliging Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 6: NOTIFICATIONS */}
        {/* ===================================================================== */}
        <TabsContent value="notifications" className="space-y-5 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">Notificatie Voorkeuren</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-3">
                {[
                  { title: 'Nieuwe Leads & Terugbelverzoeken', desc: 'Melding zodra een telemarketeer een lead toewijst of een terugbelactie plant.' },
                  { title: 'Deur-tot-Deur Order Updates', desc: 'Direct pushbericht wanneer een buitendienst sale gesloten wordt.' },
                  { title: 'Sollicitaties & Interview Bevestigingen', desc: 'Updates over nieuwe kandidaten in de recruitmentfunnel.' },
                  { title: 'Gamificatie Badges & Streaks', desc: 'Notificaties over leaderboard mijlpalen en provisies.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================== */}
        {/* TAB 7: APPEARANCE */}
        {/* ===================================================================== */}
        <TabsContent value="appearance" className="space-y-5 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">{t('Appearance')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs">{t('Theme')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      theme === 'light'
                        ? 'border-2 border-primary bg-primary/5 shadow-xs'
                        : 'border border-input hover:bg-accent/40'
                    }`}
                  >
                    <div className="mb-2 h-16 rounded-xl bg-white border shadow-xs" />
                    <p className="font-semibold text-xs sm:text-sm">{t('Light')}</p>
                    <p className="text-[11px] text-muted-foreground">{language === 'nl' ? 'Lichte weergave' : 'Light mode'}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      theme === 'dark'
                        ? 'border-2 border-primary bg-primary/5 shadow-xs'
                        : 'border border-input hover:bg-accent/40'
                    }`}
                  >
                    <div className="mb-2 h-16 rounded-xl bg-slate-900 border border-slate-700 shadow-xs" />
                    <p className="font-semibold text-xs sm:text-sm">{t('Dark')}</p>
                    <p className="text-[11px] text-muted-foreground">{language === 'nl' ? 'Donkere weergave' : 'Dark mode'}</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{t('Language')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLanguage('nl')}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      language === 'nl'
                        ? 'border-2 border-primary bg-primary/5 shadow-xs'
                        : 'border border-input hover:bg-accent/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-center h-16 rounded-xl bg-accent/40 text-xl font-bold">
                      🇳🇱 NL
                    </div>
                    <p className="font-semibold text-xs sm:text-sm">Nederlands</p>
                    <p className="text-[11px] text-muted-foreground">Standaard</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      language === 'en'
                        ? 'border-2 border-primary bg-primary/5 shadow-xs'
                        : 'border border-input hover:bg-accent/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-center h-16 rounded-xl bg-accent/40 text-xl font-bold">
                      🇬🇧 EN
                    </div>
                    <p className="font-semibold text-xs sm:text-sm">English</p>
                    <p className="text-[11px] text-muted-foreground">International</p>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={() => toast.success(t('Saved successfully'))} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {t('Save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apple-style Session & Logout Section */}
      <div className="pt-8 pb-12 flex justify-center">
        <Card className="w-full max-w-xl rounded-3xl border-red-500/20 bg-red-500/[0.03] backdrop-blur-xl shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Sessie beëindigen</p>
                <p className="text-xs text-muted-foreground">
                  Veilig uitloggen uit CRMos op dit apparaat
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="rounded-full px-6 text-xs h-9 w-full sm:w-auto font-semibold shadow-xs gap-2 shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('Log out')}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
