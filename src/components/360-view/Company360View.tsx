import { useState, useMemo } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCRMStore } from '@/stores/crmStore';
import { useD2DStore } from '@/stores/d2dStore';
import { useQuotesStore } from '@/stores/quotesStore';
import { formatCompanyTag } from '@/lib/companyAccess';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  Hash,
  UserPlus,
  Search,
} from 'lucide-react';

interface Company360ViewProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectContact?: (contactId: string) => void;
}

export function Company360View({ companyId, isOpen, onClose, onSelectContact }: Company360ViewProps) {
  const { companies, contacts, deals, inviteContactToCompany } = useCRMStore();
  const { pins } = useD2DStore();
  const { quotes } = useQuotesStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'contacts' | 'specs'>('overview');
  const [employeeQuery, setEmployeeQuery] = useState('');

  const company = useMemo(() => {
    return companies.find((c) => c.id === companyId) || null;
  }, [companyId, companies]);

  const companyTag = useMemo(() => {
    return company ? company.company_tag || formatCompanyTag(company.name) : '#crmos';
  }, [company]);

  // Find linked contacts (including those matched by #bedrijfstag)
  const linkedContacts = useMemo(() => {
    if (!company) return [];
    const tagLower = (company.company_tag || formatCompanyTag(company.name)).toLowerCase();
    return contacts.filter(
      (c) =>
        c.company_id === company.id ||
        (c.company && c.company.toLowerCase() === company.name.toLowerCase()) ||
        (c.company_tags || []).some((t) => t.toLowerCase() === tagLower) ||
        (c.tags || []).some((t) => t.toLowerCase() === tagLower)
    );
  }, [company, contacts]);

  // Find linked deals
  const linkedDeals = useMemo(() => {
    if (!company) return [];
    return deals.filter(
      (d) =>
        d.company_id === company.id ||
        (d.company_name && d.company_name.toLowerCase() === company.name.toLowerCase())
    );
  }, [company, deals]);

  // Find linked quotes
  const linkedQuotes = useMemo(() => {
    if (!company) return [];
    return quotes.filter(
      (q) =>
        q.company_id === company.id ||
        (q.customer_name && q.customer_name.toLowerCase() === company.name.toLowerCase())
    );
  }, [company, quotes]);

  // Total deal pipeline value
  const totalDealValue = useMemo(() => {
    return linkedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  }, [linkedDeals]);

  // Find matching D2D pin (with building specs and geo data)
  const matchedPin = useMemo(() => {
    if (!company || pins.length === 0) return null;
    const compNameLower = company.name?.toLowerCase().trim();
    if (compNameLower) {
      for (let i = 0; i < pins.length; i++) {
        const p = pins[i];
        if (p.business_name && p.business_name.toLowerCase().trim() === compNameLower) {
          return p;
        }
      }
    }
    if (company.address?.street && company.address.postal_code) {
      const compAddr = `${company.address.street}`.toLowerCase().replace(/\s+/g, '');
      for (let i = 0; i < pins.length; i++) {
        const p = pins[i];
        const pinAddr = `${p.street}${p.house_number}`.toLowerCase().replace(/\s+/g, '');
        if (compAddr.includes(pinAddr) || pinAddr.includes(compAddr)) {
          return p;
        }
      }
    }
    return null;
  }, [company, pins]);

  if (!company) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col bg-background overflow-hidden">
        {/* Header Section */}
        <div className="p-6 bg-muted/30 border-b space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xl shadow-xs">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
                  {matchedPin?.is_commercial && (
                    <Badge variant="secondary" className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px]">
                      B2B Pand
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {company.address?.street || 'Adres onbekend'}, {company.address?.postal_code || ''} {company.address?.city || 'Nederland'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
              {companyTag}
            </Badge>
            {company.industry && (
              <Badge variant="outline" className="text-xs font-medium">
                {company.industry}
              </Badge>
            )}
            {company.size && (
              <Badge variant="secondary" className="text-xs font-mono">
                {company.size}
              </Badge>
            )}
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-background border shadow-xs text-center">
              <p className="text-[10px] text-muted-foreground">Pijplijnwaarde</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                €{totalDealValue.toLocaleString('nl-NL')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-background border shadow-xs text-center">
              <p className="text-[10px] text-muted-foreground">Deals</p>
              <p className="text-sm font-bold mt-0.5">{linkedDeals.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background border shadow-xs text-center">
              <p className="text-[10px] text-muted-foreground">Offertes</p>
              <p className="text-sm font-bold mt-0.5">{linkedQuotes.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background border shadow-xs text-center">
              <p className="text-[10px] text-muted-foreground">Contacten</p>
              <p className="text-sm font-bold mt-0.5">{linkedContacts.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b bg-card">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-transparent h-11 p-0 gap-4 border-b-0">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 text-xs font-semibold"
              >
                360° Overzicht
              </TabsTrigger>
              <TabsTrigger
                value="deals"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 text-xs font-semibold gap-1"
              >
                <span>Deals</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted">
                  {linkedDeals.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 text-xs font-semibold gap-1"
              >
                <span>Contacten</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted">
                  {linkedContacts.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 text-xs font-semibold gap-1"
              >
                <span>Pandspecificaties</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content Area */}
        <ScrollArea className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Contact- & Bedrijfsgegevens Card */}
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Bedrijfs- en Contactkanalen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  {company.phone && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> Telefoon
                      </span>
                      <a href={`tel:${company.phone}`} className="font-semibold text-primary hover:underline">
                        {company.phone}
                      </a>
                    </div>
                  )}

                  {company.website && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </span>
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{company.domain || company.website}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> Vestigingsadres
                    </span>
                    <span className="font-medium text-right">
                      {company.address?.street || 'Onbekend'}<br />
                      {company.address?.postal_code || ''} {company.address?.city || ''}
                    </span>
                  </div>

                  {matchedPin?.opening_hours && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Openingstijden
                      </span>
                      <span className="font-medium">{matchedPin.opening_hours}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* D2D Status Card (indien gekoppeld) */}
              {matchedPin && (
                <Card className="rounded-2xl border shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Field Sales D2D Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Laatste Bezoekstatus:</span>
                      <Badge variant="outline" className="font-semibold">
                        {matchedPin.current_status}
                      </Badge>
                    </div>
                    {matchedPin.last_visit_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Bezocht op:</span>
                        <span>{new Date(matchedPin.last_visit_at).toLocaleString('nl-NL')}</span>
                      </div>
                    )}
                    {matchedPin.assigned_agent_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Toegewezen Vertegenwoordiger:</span>
                        <span>{matchedPin.assigned_agent_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Linked Quotes Card */}
              {linkedQuotes.length > 0 && (
                <Card className="rounded-2xl border shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>Lopende Offertes ({linkedQuotes.length})</span>
                      <a href="/sales/quotes" className="text-xs text-primary font-normal hover:underline">
                        Naar Offertes &rarr;
                      </a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {linkedQuotes.map((q) => (
                      <div key={q.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-semibold">{q.quote_number}: {q.title}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">Status: {q.status}</p>
                        </div>
                        <span className="font-bold text-emerald-600">€{q.total?.toLocaleString('nl-NL')}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-3">
              {linkedDeals.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl">
                  Geen actieve deals gekoppeld aan dit bedrijf.
                </div>
              ) : (
                linkedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl border bg-card flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Fase: <span className="font-medium capitalize">{deal.stage}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        €{deal.value?.toLocaleString('nl-NL')}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {deal.probability}% kans
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {/* Zoek op Bedrijfstag & Uitnodigen sectie */}
              <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/[0.04] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-sky-500" />
                    <span>Medewerkers zoeken &amp; uitnodigen ({companyTag})</span>
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={employeeQuery}
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    placeholder={`Zoek accounts op ${companyTag}, naam of e-mail om uit te nodigen...`}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>
                {employeeQuery.trim() && (
                  <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                    {contacts
                      .filter((c) => {
                        const q = employeeQuery.trim().toLowerCase();
                        return (
                          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
                          c.email.toLowerCase().includes(q) ||
                          (c.company_tags || []).some((t) => t.toLowerCase().includes(q)) ||
                          (c.tags || []).some((t) => t.toLowerCase().includes(q))
                        );
                      })
                      .slice(0, 8)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-xl bg-background border flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="truncate">
                            <span className="font-semibold">{c.first_name} {c.last_name}</span>
                            <span className="text-muted-foreground ml-1.5">({c.email})</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const inv = inviteContactToCompany(company.id, c.id, 'Medewerker');
                              if (inv) {
                                toast.success(`${c.first_name} ${c.last_name} uitgenodigd voor ${company.name}!`);
                                setEmployeeQuery('');
                              }
                            }}
                            className="h-7 rounded-full text-[11px] px-2.5 bg-sky-600 hover:bg-sky-700 text-white gap-1 shrink-0"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>Uitnodigen</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {linkedContacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl">
                  Geen individuele contactpersonen geregistreerd onder dit bedrijf of met bedrijfstag {companyTag}.
                </div>
              ) : (
                linkedContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border bg-card flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => {
                      onClose();
                      onSelectContact?.(c.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm">{c.first_name} {c.last_name}</p>
                          <Badge variant="outline" className="font-mono text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                            {companyTag}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.title || c.email}</p>
                      </div>
                    </div>
                    {c.phone && <span className="text-xs text-muted-foreground font-mono">{c.phone}</span>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-sky-600" />
                    Pandspecificaties & Vestiging
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40">
                    <div>
                      <span className="text-muted-foreground">Type Pand / Bestemming:</span>
                      <p className="font-semibold mt-0.5">{matchedPin?.bag_gebruiksdoel || company.industry || 'Bedrijfspand'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vloeroppervlakte:</span>
                      <p className="font-semibold mt-0.5">{matchedPin?.surface_area_m2 ? `${matchedPin.surface_area_m2} m²` : (company.size || 'Onbekend')}</p>
                    </div>
                  </div>
                  {matchedPin?.build_year && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground">Bouwjaar Pand:</span>
                      <span className="font-semibold">{matchedPin.build_year}</span>
                    </div>
                  )}
                  {matchedPin?.pand_identificatie && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground">Pand Referentienummer:</span>
                      <span className="font-mono text-[11px]">{matchedPin.pand_identificatie}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
