import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Users,
  Briefcase,
  MoreHorizontal,
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

export function CompaniesPage() {
  const { companies, addCompany, deleteCompany } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    phone: '',
    website: '',
  });

  const accessibleCompanies = filterRecordsForUser(user, companies, adminCompanyFilter);

  const filteredCompanies = accessibleCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCompany = () => {
    addCompany({
      ...newCompany,
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
      contacts_count: 0,
      deals_count: 0,
    });
    setIsAddDialogOpen(false);
    setNewCompany({ name: '', domain: '', industry: '', size: '', phone: '', website: '' });
    toast.success('Bedrijf succesvol opgeslagen');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Company',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.domain && (
              <p className="text-xs text-muted-foreground">{row.original.domain}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        row.original.industry || <span className="text-muted-foreground">-</span>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        row.original.size || <span className="text-muted-foreground">-</span>
      ),
    },
    {
      accessorKey: 'contacts',
      header: 'Contacts',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.contacts_count}</span>
        </div>
      ),
    },
    {
      accessorKey: 'deals',
      header: 'Deals',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.deals_count}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof companies[0] } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteCompany(row.original.id)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your business accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Input
                    value={newCompany.size}
                    onChange={(e) => setNewCompany({ ...newCompany, size: e.target.value })}
                    placeholder="e.g., 50-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleAddCompany}>Bedrijf toevoegen</Button>
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
                  ? `Admin Masterview (${accessibleCompanies.length} bedrijven)`
                  : isCorePartner
                  ? `CRMos Core Dataset (${accessibleCompanies.length} bedrijven)`
                  : `${userCompanyName} Workspace (${accessibleCompanies.length} bedrijven)`}
              </p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {isSuperAdmin
                  ? (adminCompanyFilter === 'all' ? 'Alle Bedrijven' : adminCompanyFilter)
                  : userCompanyName}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? 'Als administrator heb je overkoepelend toezicht en beheer over alle aangesloten organisaties.'
                : isCorePartner
                ? 'Deze CRMos bedrijfsdata is gedeeld en exclusief zichtbaar voor CRMos, VVC, Quantum Initium, Logs Rent, Djobba en Trusting Work.'
                : `Strikte data-isolatie actief: Deze bedrijven zijn uitsluitend zichtbaar voor medewerkers van ${userCompanyName}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Totaal Bedrijven</p>
            <p className="text-2xl font-bold">{accessibleCompanies.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Met Actieve Deals</p>
            <p className="text-2xl font-bold">
              {accessibleCompanies.filter((c) => c.deals_count > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Contacten</p>
            <p className="text-2xl font-bold">
              {accessibleCompanies.reduce((sum, c) => sum + (c.contacts_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sectoren</p>
            <p className="text-2xl font-bold">
              {new Set(accessibleCompanies.map((c) => c.industry).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
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

      <DataTable columns={columns} data={filteredCompanies} />
    </div>
  );
}
