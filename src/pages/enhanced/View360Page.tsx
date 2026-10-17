import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCRMStore } from '@/stores/crmStore';
import { Contact360View } from '@/components/360-view/Contact360View';
import { Company360View } from '@/components/360-view/Company360View';
import {
  Search,
  Star,
  TrendingUp,
  Euro,
  Phone,
  Mail,
  Calendar,
  Building2,
  Users,
  MapPin,
} from 'lucide-react';

export function View360Page() {
  const { contacts, companies, deals, getContact360 } = useCRMStore();
  const [viewType, setViewType] = useState<'contacts' | 'companies'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address?.street?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">360° Relatie & Klantoverzicht</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Contacten & Bedrijven
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Integraal 360° beeld van je contactpersonen, bedrijven, deals en vestigingsdata
          </p>
        </div>

        {/* Tab Toggle: Contacten vs Bedrijven */}
        <div className="flex items-center rounded-xl border bg-muted/40 p-1 shadow-xs shrink-0">
          <Button
            variant={viewType === 'companies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('companies')}
            className="rounded-lg text-xs gap-1.5 h-8 px-3 font-semibold"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Bedrijven & Panden ({companies.length})</span>
          </Button>
          <Button
            variant={viewType === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('contacts')}
            className="rounded-lg text-xs gap-1.5 h-8 px-3 font-semibold"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contactpersonen ({contacts.length})</span>
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={
            viewType === 'companies'
              ? 'Zoek bedrijven op naam, branche, stad of adres...'
              : 'Zoek contactpersonen op naam, e-mail of bedrijf...'
          }
          className="pl-10 rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {viewType === 'contacts' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => {
            const contact360 = getContact360(contact.id);
            return (
              <Card
                key={contact.id}
                className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border"
                onClick={() => setSelectedContactId(contact.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="text-base rounded-xl font-bold bg-primary/10 text-primary">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{contact.title || 'Geen functie'}</p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-medium truncate">{contact.company}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-xs">{contact360?.score || 0}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">€{(contact360?.lifetime_value || 0).toLocaleString('nl-NL')}</p>
                        <p className="text-[10px] text-muted-foreground">Klantwaarde</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-sky-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{contact360?.interactions_count || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Interacties</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      <Mail className="h-3 w-3" />
                      {contact360?.emails_sent || 0}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      <Phone className="h-3 w-3" />
                      {contact360?.calls_made || 0}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      <Calendar className="h-3 w-3" />
                      {contact360?.meetings_held || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Companies 360 Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => {
            // Check linked deals & contacts
            const companyDeals = deals.filter(
              (d) =>
                d.company_id === company.id ||
                (d.company_name && d.company_name.toLowerCase() === company.name.toLowerCase())
            );
            const totalCompanyDealVal = companyDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const companyContacts = contacts.filter(
              (c) =>
                c.company_id === company.id ||
                (c.company && c.company.toLowerCase() === company.name.toLowerCase())
            );

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
                      <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
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

                  {/* Deals & Contacts Metrics */}
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
                        {companyContacts.length} {companyContacts.length === 1 ? 'contact' : 'contacten'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contact 360 Drawer */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />

      {/* Company 360 Drawer */}
      <Company360View
        companyId={selectedCompanyId}
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        onSelectContact={(contactId) => {
          setSelectedCompanyId(null);
          setSelectedContactId(contactId);
        }}
      />
    </div>
  );
}

