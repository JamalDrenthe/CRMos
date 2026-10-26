import { useState, useMemo, useDeferredValue } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCRMStore } from '@/stores/crmStore';
import { getVvcTag } from '@/services/vvcTagService';
import {
  smartSearchContacts,
  smartSearchCompanies,
  isReferredByJamal,
} from '@/services/crmSearchEngine';
import { Contact360View } from '@/components/360-view/Contact360View';
import { Company360View } from '@/components/360-view/Company360View';
import {
  Search,
  Star,
  TrendingUp,
  Euro,
  Phone,
  Mail,
  Building2,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Crown,
  Plus,
} from 'lucide-react';

const PAGE_SIZE = 24;

export function View360Page() {
  const { contacts, companies, deals, activities, syncStatus, isFirestoreSynced } = useCRMStore();
  const [viewType, setViewType] = useState<'companies' | 'contacts'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // React 18 Deferred Value for instant typing response without input lag
  const deferredQuery = useDeferredValue(searchQuery);

  // 1. High-Performance O(N) Hash Map Indexing for Companies (Deals & Contacts)
  const { companyDealsMap, companyContactsMap, totalPipelineVal } = useMemo(() => {
    const dealsMap = new Map<string, { count: number; totalValue: number }>();
    const contactsMap = new Map<string, number>();
    let pipeSum = 0;

    // Single pass over deals
    for (let i = 0; i < deals.length; i++) {
      const d = deals[i];
      const val = d.value || 0;
      pipeSum += val;

      if (d.company_id) {
        const entry = dealsMap.get(d.company_id) || { count: 0, totalValue: 0 };
        dealsMap.set(d.company_id, { count: entry.count + 1, totalValue: entry.totalValue + val });
      }
      if (d.company_name) {
        const key = d.company_name.toLowerCase().trim();
        const entry = dealsMap.get(key) || { count: 0, totalValue: 0 };
        dealsMap.set(key, { count: entry.count + 1, totalValue: entry.totalValue + val });
      }
    }

    // Single pass over contacts
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      if (c.company_id) {
        contactsMap.set(c.company_id, (contactsMap.get(c.company_id) || 0) + 1);
      }
      if (c.company) {
        const key = c.company.toLowerCase().trim();
        contactsMap.set(key, (contactsMap.get(key) || 0) + 1);
      }
    }

    return { companyDealsMap: dealsMap, companyContactsMap: contactsMap, totalPipelineVal: pipeSum };
  }, [deals, contacts]);

  // 2. High-Performance O(N) Hash Map Indexing for Contact Metrics (avoids sorting/date parsing per card)
  const contactMetricsMap = useMemo(() => {
    const metrics = new Map<
      string,
      {
        score: number;
        lifetime_value: number;
        interactions_count: number;
        emails_sent: number;
        calls_made: number;
        meetings_held: number;
      }
    >();

    const actCounts = new Map<string, { total: number; emails: number; calls: number; meetings: number }>();
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (a.related_to?.type === 'contact' && a.related_to.id) {
        const cid = a.related_to.id;
        const cur = actCounts.get(cid) || { total: 0, emails: 0, calls: 0, meetings: 0 };
        cur.total += 1;
        if (a.type === 'email') cur.emails += 1;
        if (a.type === 'call') cur.calls += 1;
        if (a.type === 'meeting') cur.meetings += 1;
        actCounts.set(cid, cur);
      }
    }

    const dealValues = new Map<string, number>();
    for (let i = 0; i < deals.length; i++) {
      const d = deals[i];
      if (d.contact_id && (d.stage === 'closed-won' || d.stage === 'won')) {
        dealValues.set(d.contact_id, (dealValues.get(d.contact_id) || 0) + (d.value || 0));
      }
    }

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const act = actCounts.get(c.id) || { total: 0, emails: 0, calls: 0, meetings: 0 };
      const ltv = dealValues.get(c.id) || 0;
      const score = c.score || Math.min(100, 30 + act.total * 5 + act.emails * 2 + act.calls * 3);
      metrics.set(c.id, {
        score,
        lifetime_value: ltv,
        interactions_count: act.total,
        emails_sent: act.emails,
        calls_made: act.calls,
        meetings_held: act.meetings,
      });
    }

    return metrics;
  }, [contacts, deals, activities]);

  // 3. Memoized Filtering using Smart Search Engine & Deferred Query
  const filteredCompanies = useMemo(() => {
    return smartSearchCompanies(companies, deferredQuery);
  }, [companies, deferredQuery]);

  const filteredContacts = useMemo(() => {
    return smartSearchContacts(contacts, deferredQuery);
  }, [contacts, deferredQuery]);

  // 4. Pagination Calculation
  const activeCount = viewType === 'companies' ? filteredCompanies.length : filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(activeCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCompanies = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, safePage]);

  const paginatedContacts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, safePage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleTabChange = (type: 'companies' | 'contacts') => {
    setViewType(type);
    setCurrentPage(1);
  };

  const isInitialLoading = !isFirestoreSynced && companies.length === 0 && contacts.length === 0 && syncStatus === 'syncing';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">360° Relatie & Klantoverzicht</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              <Sparkles className="h-3 w-3 mr-1 text-primary inline" />
              Real-time
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Integraal 360° beeld van je contactpersonen, bedrijven, deals en vestigingsdata
          </p>
        </div>

        {/* Tab Toggle: Contacten vs Bedrijven */}
        <div className="flex items-center rounded-xl border bg-muted/40 p-1 shadow-xs shrink-0">
          <Button
            variant={viewType === 'companies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('companies')}
            className="rounded-lg text-xs gap-1.5 h-8 px-3.5 font-semibold transition-all"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Bedrijven ({companies.length})</span>
          </Button>
          <Button
            variant={viewType === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('contacts')}
            className="rounded-lg text-xs gap-1.5 h-8 px-3.5 font-semibold transition-all"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contactpersonen ({contacts.length})</span>
          </Button>
        </div>
      </div>

      {/* KPI Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Totaal Bedrijven</span>
          <p className="text-xl font-bold text-foreground mt-0.5">{companies.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Contactpersonen</span>
          <p className="text-xl font-bold text-foreground mt-0.5">{contacts.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Actieve Deals</span>
          <p className="text-xl font-bold text-foreground mt-0.5">{deals.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Totale Pijplijnwaarde</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            €{totalPipelineVal.toLocaleString('nl-NL')}
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              viewType === 'companies'
                ? 'Zoek bedrijven op naam, branche, stad of adres...'
                : 'Zoek contactpersonen op naam, e-mail of bedrijf...'
            }
            className="pl-10 h-10 rounded-xl bg-card border-border/80 shadow-xs text-sm"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Counter Pill */}
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end sm:self-center">
          <span>Getoond:</span>
          <Badge variant="secondary" className="font-mono text-xs font-semibold">
            {activeCount === 0 ? 0 : `${(safePage - 1) * PAGE_SIZE + 1} - ${Math.min(safePage * PAGE_SIZE, activeCount)}`} van {activeCount}
          </Badge>
        </div>
      </div>

      {/* Skeletons while initial data stream connects */}
      {isInitialLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-2xl border p-5 space-y-3.5 animate-pulse">
              <div className="flex items-start gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-md w-3/4" />
                  <div className="h-3 bg-muted rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-14 bg-muted/60 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : activeCount === 0 ? (
        /* Empty State */
        <Card className="rounded-2xl border border-dashed p-12 text-center bg-card/40">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              {viewType === 'companies' ? <Building2 className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            </div>
            <h3 className="font-bold text-base text-foreground">
              {searchQuery ? 'Geen resultaten gevonden' : viewType === 'companies' ? 'Nog geen bedrijven' : 'Nog geen contactpersonen'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `Er zijn geen ${viewType === 'companies' ? 'bedrijven' : 'contactpersonen'} gevonden voor "${searchQuery}". Probeer een andere zoekterm.`
                : viewType === 'companies'
                ? 'Voeg bedrijven toe via het CRM of importeer panden via de Field loopkaart.'
                : 'Voeg contactpersonen toe via het CRM om hier hun 360° klantprofiel te zien.'}
            </p>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange('')} className="rounded-xl text-xs">
                Zoekfilter wissen
              </Button>
            )}
          </div>
        </Card>
      ) : viewType === 'contacts' ? (
        /* Contacts 360 Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedContacts.map((contact) => {
            const metrics = contactMetricsMap.get(contact.id) || {
              score: contact.score || 50,
              lifetime_value: 0,
              interactions_count: 0,
              emails_sent: 0,
              calls_made: 0,
              meetings_held: 0,
            };

            const contactVvcTag = getVvcTag(contact);
            const allTags = Array.from(
              new Set([
                ...(contactVvcTag ? [contactVvcTag] : []),
                ...(contact.company_tags || []),
                ...(contact.tags || []),
              ])
            ).filter(Boolean);
            const isJamalRef = contact.can_start_team || isReferredByJamal(contact.referred_by_name);
            const teamStatus = contact.team_status || 'active';

            return (
              <Card
                key={contact.id}
                className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border bg-card hover:border-primary/40 group"
                onClick={() => setSelectedContactId(contact.id)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-12 w-12 rounded-xl ring-2 ring-background group-hover:scale-105 transition-transform">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="text-base rounded-xl font-bold bg-primary/10 text-primary">
                        {contact.first_name?.[0] || '?'}
                        {(contact.last_name || contact.first_name?.slice(1) || '')[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.title || 'Team Member'} • {contact.company || 'VVC'}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <Badge
                          variant="outline"
                          className={
                            teamStatus === 'active'
                              ? 'text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                              : 'text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold'
                          }
                        >
                          {contact.team_name || 'Team Jamal Drenthe'} ({teamStatus === 'active' ? 'Actief' : 'Passief'})
                        </Badge>
                        {isJamalRef && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 flex items-center gap-0.5"
                          >
                            <Crown className="h-2.5 w-2.5" />
                            <span>Via Jamal Drenthe</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-xs">{metrics.score}</span>
                    </div>
                  </div>

                  {/* Direct Phone & Email summary */}
                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <Phone className="h-3 w-3 text-emerald-500 shrink-0" />
                        {contact.phone || 'Geen telefoonnummer'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Via: {contact.referred_by_name || 'Jamal Drenthe'}
                      </span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags strip */}
                  <div className="flex flex-wrap items-center gap-1">
                    {allTags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={
                          tag.toLowerCase().startsWith('vvc-')
                            ? 'text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                            : tag.startsWith('#')
                            ? 'text-[10px] font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                            : 'text-[10px] bg-background'
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                    {allTags.length > 4 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{allTags.length - 4}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] border-dashed border-primary/40 text-primary flex items-center gap-0.5"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>Tag toevoegen</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">€{metrics.lifetime_value.toLocaleString('nl-NL')}</p>
                        <p className="text-[10px] text-muted-foreground">Klantwaarde</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-sky-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{metrics.interactions_count}</p>
                        <p className="text-[10px] text-muted-foreground">Interacties</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Companies 360 Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedCompanies.map((company) => {
            const dealStats = companyDealsMap.get(company.id) || (company.name ? companyDealsMap.get(company.name.toLowerCase().trim()) : null);
            const totalCompanyDealVal = dealStats?.totalValue || 0;
            const contactCount = companyContactsMap.get(company.id) || (company.name ? companyContactsMap.get(company.name.toLowerCase().trim()) : null) || 0;

            return (
              <Card
                key={company.id}
                className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border bg-card hover:border-primary/40 group"
                onClick={() => setSelectedCompanyId(company.id)}
              >
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {company.name}
                        </h3>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {company.industry || 'Zakelijke Dienstverlening'}
                      </p>
                      {company.address?.city && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{company.address.street || ''}, {company.address.city}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges strip */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {company.size && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {company.size}
                      </Badge>
                    )}
                    {company.domain && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        🌐 {company.domain}
                      </Badge>
                    )}
                  </div>

                  {/* Deals & Contacts Metrics (O(1) lookup) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-[10px] text-muted-foreground">Pijplijnwaarde</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        €{totalCompanyDealVal.toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-[10px] text-muted-foreground">Contactpersonen</span>
                      <p className="font-bold mt-0.5">
                        {contactCount} {contactCount === 1 ? 'contact' : 'contacten'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Pagina <span className="font-bold text-foreground">{safePage}</span> van{' '}
            <span className="font-bold text-foreground">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Vorige</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl h-8 text-xs gap-1"
            >
              <span>Volgende</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Contact 360 Drawer - Only mounted when selected to save initialization overhead */}
      {selectedContactId && (
        <Contact360View
          contactId={selectedContactId}
          isOpen={!!selectedContactId}
          onClose={() => setSelectedContactId(null)}
        />
      )}

      {/* Company 360 Drawer - Only mounted when selected to save initialization overhead */}
      {selectedCompanyId && (
        <Company360View
          companyId={selectedCompanyId}
          isOpen={!!selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          onSelectContact={(contactId) => {
            setSelectedCompanyId(null);
            setSelectedContactId(contactId);
          }}
        />
      )}
    </div>
  );
}
