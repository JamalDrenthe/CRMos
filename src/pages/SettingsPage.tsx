import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Blocks,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { seedDemoDataToFirestore } from '@/services/firestoreService';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();

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
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {user?.email || 'info@jamaldrenthe.com'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground font-mono">
                <span>Organisatie: <strong className="text-foreground">{user?.org_id || 'crmosone-dev'}</strong></span>
                <span>•</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Account Actief
                </span>
              </div>
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
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">Persoonlijke Gegevens</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Beheer je naam, e-mailadres en contactinformatie.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Voornaam</Label>
                  <Input defaultValue={user?.name?.split(' ')[0] || 'Jamal'} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Achternaam</Label>
                  <Input defaultValue={user?.name?.split(' ')[1] || 'Drenthe'} className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>E-mailadres</span>
                  </Label>
                  <Input type="email" defaultValue={user?.email || 'info@jamaldrenthe.com'} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Telefoonnummer</span>
                  </Label>
                  <Input placeholder="+31 6 12345678" defaultValue="+31 6 12345678" className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Tijdzone</span>
                </Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs">
                  <option value="Europe/Amsterdam">Europa / Amsterdam (CET/CEST)</option>
                  <option value="Europe/London">Londen (GMT/BST)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button onClick={() => toast.success('Profiel succesvol bijgewerkt')} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Wijzigingen Opslaan
                </Button>
              </div>
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
        <TabsContent value="organization" className="space-y-5 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-lg font-bold">Organisatie Instellingen</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Bedrijfsprofiel, rayonstructuur en administratieve instellingen.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bedrijfsnaam</Label>
                  <Input defaultValue="CRMos Commercial Operations" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type Organisatie</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs">
                    <option value="sales_agency">Field Sales &amp; Deur-tot-deur Organisatie</option>
                    <option value="callcenter">Callcenter &amp; Telemarketing Bureau</option>
                    <option value="recruitment">Recruitment &amp; Uitzendbureau</option>
                    <option value="hybrid">Hybride Commerciële Onderneming</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">KVK Nummer</Label>
                  <Input placeholder="12345678" defaultValue="84920114" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">BTW Nummer</Label>
                  <Input placeholder="NL84920114B01" defaultValue="NL84920114B01" className="h-9 text-xs" />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={() => toast.success('Organisatiegegevens opgeslagen')} className="rounded-full px-6 h-9 text-xs">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Organisatie Opslaan
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
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Voorbeelddata Inladen (3 Disciplines Demo)</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Laad met één klik realistische Nederlandse demorecords in voor <strong>Field Sales</strong> (Singel 240, D2D orders), <strong>Callcenter</strong> (Q4 Glasvezel campagne, belscripts), en <strong>Recruitment</strong> (kandidaten voor werving-tot-omzet keten).
                  </p>
                </div>

                <Button
                  onClick={handleSeedDemoData}
                  disabled={isSeeding}
                  className="rounded-full gap-2 px-6 h-9 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Bezig met inladen...' : 'Laad 3 Disciplines Demodata In'}</span>
                </Button>
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
    </div>
  );
}
