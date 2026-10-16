import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/common/DataTable';
import { Contact360View } from '@/components/360-view/Contact360View';
import { TwilioDialerModal } from '@/components/telephony/TwilioDialerModal';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import { formatDistanceToNow } from 'date-fns';
import type { Contact } from '@/types';
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Building2,
  Star,
  ShieldCheck,
  Lock,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contacts, addContact, deleteContact } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();
  const { addAuditLog } = useEnhancedStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    searchParams.get('id')
  );
  const [dialerContact, setDialerContact] = useState<Contact | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'lead' as const,
    source: 'Manual',
    tags: [] as string[],
    custom_fields: {},
    allowed_companies: isCorePartner
      ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
      : [userCompanyName],
  });

  // Strict company isolation / ecosystem filtering (Memoized)
  const accessibleContacts = useMemo(() => {
    return filterRecordsForUser(user, contacts, adminCompanyFilter);
  }, [user, contacts, adminCompanyFilter]);

  // Search filtering (Memoized)
  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accessibleContacts;
    return accessibleContacts.filter(
      (contact) =>
        contact.first_name.toLowerCase().includes(query) ||
        contact.last_name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
    );
  }, [accessibleContacts, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated contacts slice (High Performance: renders only 25/50/100 rows instead of 1,274)
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  const handleAddContact = () => {
    const contact = addContact({
      ...newContact,
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
    });
    addAuditLog({
      action: 'contact_created',
      entity_type: 'contact',
      entity_id: contact.id,
      user_id: user?.id || 'user1',
      user_name: user?.name || 'CRMos Gebruiker',
      new_values: newContact,
    });
    setIsAddDialogOpen(false);
    setNewContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'lead',
      source: 'Manual',
      tags: [],
      custom_fields: {},
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
    });
    toast.success('Contact succesvol opgeslagen');
  };

  const handleDeleteContact = useCallback((id: string) => {
    deleteContact(id);
    toast.success('Contact verwijderd');
  }, [deleteContact]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Naam',
      cell: ({ row }: { row: { original: Contact } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/40">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {row.original.first_name[0]}{row.original.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {row.original.first_name} {row.original.last_name}
            </p>
            {row.original.title && (
              <p className="text-xs text-muted-foreground">{row.original.title}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
      cell: ({ row }: { row: { original: Contact } }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <a
            href={`mailto:${row.original.email}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline text-xs text-foreground truncate max-w-[180px]"
          >
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Telefoon',
      cell: ({ row }: { row: { original: Contact } }) => (
        row.original.phone ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDialerContact(row.original);
              }}
              title="Direct bellen via Twilio of GSM"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
            >
              <PhoneCall className="h-3 w-3" />
              <span>{row.original.phone}</span>
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'company',
      header: 'Bedrijf',
      cell: ({ row }: { row: { original: Contact } }) => (
        row.original.company ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground font-medium">{row.original.company}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Contact } }) => (
        <Badge
          variant={
            row.original.status === 'customer'
              ? 'default'
              : row.original.status === 'prospect'
              ? 'secondary'
              : 'outline'
          }
          className="capitalize text-[11px] font-semibold"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }: { row: { original: Contact } }) => {
        const score = (row.original as Contact & { score?: number }).score ?? 75;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Star
              className={`h-3.5 w-3.5 ${
                score >= 80 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
              }`}
            />
            <span className="font-semibold">{score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_contact',
      header: 'Laatste Contact',
      cell: ({ row }: { row: { original: Contact } }) => (
        row.original.last_contact_at ? (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.last_contact_at), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Nooit</span>
        )
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Contact } }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialerContact(row.original)}
            title="Bellen via Twilio"
            className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-500/10"
          >
            <PhoneCall className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedContactId(row.original.id)}
            title="Open 360° Profiel"
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
          >
            <UserCheck className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={() => setSelectedContactId(row.original.id)}>
                View 360° Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/crm/contacts?id=${row.original.id}`)}>
                Bewerken
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteContact(row.original.id)}
                className="text-destructive"
              >
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, handleDeleteContact]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Beheer je zakelijke contacten en belcampagnes vanuit één overzicht
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm gap-1.5 h-10 px-5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              <span>Nieuw Contact</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Contactpersoon toevoegen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3.5 py-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Voornaam</Label>
                  <Input
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Achternaam</Label>
                  <Input
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bedrijfstoewijzing</Label>
                <Input
                  value={newContact.company || userCompanyName}
                  disabled
                  className="bg-muted/40 text-xs font-mono h-9"
                />
                <p className="text-[10px] text-muted-foreground">
                  Gekoppeld aan {userCompanyName} {isCorePartner ? '(gedeeld met CRMos kernpartners)' : '(strikt geïsoleerd)'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Telefoonnummer</Label>
                <Input
                  placeholder="+31 6 12345678"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bedrijfsnaam</Label>
                  <Input
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Functietitel</Label>
                  <Input
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <Button onClick={handleAddContact} className="mt-2 rounded-xl h-10 font-semibold">
                Contact Opslaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Company Isolation / Ecosystem Badge Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          {isSuperAdmin ? (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
          ) : isCorePartner ? (
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-foreground">
                {isSuperAdmin
                  ? `Admin Masterview (${accessibleContacts.length} contacten zichtbaar)`
                  : isCorePartner
                  ? `CRMos Core Dataset (${accessibleContacts.length} contacten)`
                  : `${userCompanyName} Workspace (${accessibleContacts.length} contacten)`}
              </p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {isSuperAdmin
                  ? (adminCompanyFilter === 'all' ? 'Alle Bedrijven' : adminCompanyFilter)
                  : userCompanyName}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? 'Als administrator heb je overkoepelend toezicht en kun je data van alle organisaties inzien.'
                : isCorePartner
                ? 'Deze CRMos bedrijfsdata is gedeeld en exclusief zichtbaar voor CRMos, VVC, Quantum Initium, Logs Rent, Djobba en Trusting Work.'
                : `Strikte data-isolatie actief: Deze contacten zijn uitsluitend zichtbaar voor medewerkers van ${userCompanyName}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Totaal Contacten</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {accessibleContacts.length.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Leads</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {accessibleContacts.filter((c) => c.status === 'lead').length.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Prospects</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {accessibleContacts.filter((c) => c.status === 'prospect').length.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Klanten</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {accessibleContacts.filter((c) => c.status === 'customer').length.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, email, telefoon of bedrijf..."
            className="pl-9 h-10 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
          <span>Weergave:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-input bg-background px-2 py-0.5 text-xs text-foreground font-medium"
          >
            <option value={25}>25 per pagina</option>
            <option value={50}>50 per pagina</option>
            <option value={100}>100 per pagina</option>
          </select>
        </div>
      </div>

      {/* Table Container (Paginated for instant 60 FPS mobile response) */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
        <DataTable
          columns={columns}
          data={paginatedContacts}
          onRowClick={(row) => setSelectedContactId(row.id)}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          Toont{' '}
          <span className="font-semibold text-foreground">
            {filteredContacts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          -{' '}
          <span className="font-semibold text-foreground">
            {Math.min(currentPage * pageSize, filteredContacts.length)}
          </span>{' '}
          van{' '}
          <span className="font-semibold text-foreground">
            {filteredContacts.length.toLocaleString('nl-NL')}
          </span>{' '}
          contacten
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="Eerste pagina"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Vorige pagina"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-3 text-xs font-semibold text-foreground">
            Pagina {currentPage} van {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            title="Volgende pagina"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            title="Laatste pagina"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 360 View Slide-over */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />

      {/* Quick Twilio Dialer Modal from Row Phone Click */}
      {dialerContact && (
        <TwilioDialerModal
          isOpen={!!dialerContact}
          onClose={() => setDialerContact(null)}
          contact={dialerContact}
        />
      )}
    </div>
  );
}
