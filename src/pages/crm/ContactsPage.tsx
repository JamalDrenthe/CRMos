import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/common/DataTable';
import { Contact360View } from '@/components/360-view/Contact360View';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Building2,
  Star,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  // Strict company isolation / ecosystem filtering
  const accessibleContacts = filterRecordsForUser(user, contacts, adminCompanyFilter);

  const filteredContacts = accessibleContacts.filter(
    (contact) =>
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDeleteContact = (id: string) => {
    deleteContact(id);
    toast.success('Contact verwijderd');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback>
              {row.original.first_name[0]}{row.original.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
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
      header: 'Email',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a href={`mailto:${row.original.email}`} className="hover:underline">
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        row.original.company ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.company}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <Badge variant={
          row.original.status === 'customer' ? 'default' :
          row.original.status === 'prospect' ? 'secondary' :
          'outline'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: () => {
        const score = Math.floor(Math.random() * 40) + 60; // Simulated score
        return (
          <div className="flex items-center gap-2">
            <Star className={`h-4 w-4 ${score >= 80 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
            <span>{score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_contact',
      header: 'Last Contact',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        row.original.last_contact_at ? (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.last_contact_at), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedContactId(row.original.id)}>
              View 360° Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/crm/contacts?id=${row.original.id}`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteContact(row.original.id)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Beheer je zakelijke contacten en relaties</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nieuw Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Contactpersoon toevoegen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voornaam</Label>
                  <Input
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Achternaam</Label>
                  <Input
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bedrijfstoewijzing</Label>
                <Input
                  value={newContact.company || userCompanyName}
                  disabled
                  className="bg-muted/40 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Gekoppeld aan {userCompanyName} {isCorePartner ? '(gedeeld met CRMos kernpartners)' : '(strikt geïsoleerd)'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddContact}>Create Contact</Button>
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
            <div className="flex items-center gap-2">
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Totaal Contacten</p>
            <p className="text-2xl font-bold">{accessibleContacts.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Leads</p>
            <p className="text-2xl font-bold">
              {accessibleContacts.filter((c) => c.status === 'lead').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Prospects</p>
            <p className="text-2xl font-bold">
              {accessibleContacts.filter((c) => c.status === 'prospect').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Klanten</p>
            <p className="text-2xl font-bold">
              {accessibleContacts.filter((c) => c.status === 'customer').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        onRowClick={(row) => setSelectedContactId(row.id)}
      />

      {/* 360 View Slide-over */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
