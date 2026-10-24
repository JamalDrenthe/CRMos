import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import type { Company } from '@/types';
import {
  Plus,
  Search,
  Building2,
  Users,
  Briefcase,
  MoreHorizontal,
  ShieldCheck,
  Lock,
  Edit3,
  Eye,
  Trash2,
  Globe,
  Phone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function CompaniesPage() {
  const { companies, addCompany, updateCompany, deleteCompany } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    phone: '',
    website: '',
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    kvk_number: '',
    domain: '',
    industry: '',
    size: '',
    phone: '',
    website: '',
    street: '',
    postal_code: '',
    city: '',
  });

  const accessibleCompanies = useMemo(
    () => filterRecordsForUser(user, companies, adminCompanyFilter),
    [user, companies, adminCompanyFilter]
  );

  const filteredCompanies = useMemo(() => {
    return accessibleCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [accessibleCompanies, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  const handleAddCompany = () => {
    if (!newCompany.name.trim()) {
      toast.error('Vul een bedrijfsnaam in');
      return;
    }
    addCompany({
      name: newCompany.name.trim(),
      kvk_number: newCompany.kvk_number.trim() || undefined,
      domain: newCompany.domain.trim() || undefined,
      industry: newCompany.industry.trim() || undefined,
      size: newCompany.size.trim() || undefined,
      phone: newCompany.phone.trim() || undefined,
      website: newCompany.website.trim() || undefined,
      address: {
        street: newCompany.street.trim() || undefined,
        postal_code: newCompany.postal_code.trim() || undefined,
        city: newCompany.city.trim() || undefined,
        country: 'Nederland',
      },
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
      contacts_count: 0,
      deals_count: 0,
    });
    setIsAddDialogOpen(false);
    setNewCompany({
      name: '',
      kvk_number: '',
      domain: '',
      industry: '',
      size: '',
      phone: '',
      website: '',
      street: '',
      postal_code: '',
      city: '',
    });
    toast.success('Bedrijf succesvol opgeslagen');
  };

  const handleStartEdit = (company: Company) => {
    setEditingCompany(company);
    setEditFormData({
      name: company.name,
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.size || '',
      phone: company.phone || '',
      website: company.website || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingCompany) return;
    updateCompany(editingCompany.id, {
      name: editFormData.name.trim() || editingCompany.name,
      domain: editFormData.domain.trim() || undefined,
      industry: editFormData.industry.trim() || undefined,
      size: editFormData.size.trim() || undefined,
      phone: editFormData.phone.trim() || undefined,
      website: editFormData.website.trim() || undefined,
    });
    setEditingCompany(null);
    if (viewingCompany?.id === editingCompany.id) {
      setViewingCompany((prev) =>
        prev
          ? {
              ...prev,
              name: editFormData.name.trim() || prev.name,
              domain: editFormData.domain.trim() || undefined,
              industry: editFormData.industry.trim() || undefined,
              size: editFormData.size.trim() || undefined,
              phone: editFormData.phone.trim() || undefined,
              website: editFormData.website.trim() || undefined,
            }
          : null
      );
    }
    toast.success('Bedrijfsgegevens succesvol bijgewerkt');
  };

  const handleDeleteCompany = (company: Company) => {
    deleteCompany(company.id);
    if (viewingCompany?.id === company.id) {
      setViewingCompany(null);
    }
    toast.success(`Bedrijf "${company.name}" verwijderd`);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Bedrijf',
      cell: ({ row }: { row: { original: Company } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{row.original.name}</p>
            {row.original.domain && (
              <p className="text-xs text-muted-foreground">{row.original.domain}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: 'Sector',
      cell: ({ row }: { row: { original: Company } }) => (
        row.original.industry ? (
          <Badge variant="outline" className="text-xs font-normal">
            {row.original.industry}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'size',
      header: 'Grootte',
      cell: ({ row }: { row: { original: Company } }) => (
        row.original.size ? (
          <span className="text-xs font-medium">{row.original.size} medewerkers</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'contacts',
      header: 'Contacten',
      cell: ({ row }: { row: { original: Company } }) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{row.original.contacts_count || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'deals',
      header: 'Deals',
      cell: ({ row }: { row: { original: Company } }) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{row.original.deals_count || 0}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Company } }) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setViewingCompany(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Details inzien</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStartEdit(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Bewerken</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteCompany(row.original)}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Verwijderen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            <div className="grid gap-3 py-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bedrijfsnaam *</Label>
                <Input
                  placeholder="bijv. Jansen Techniek B.V."
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">KVK-nummer</Label>
                  <Input
                    placeholder="8-cijferig KVK nr"
                    value={newCompany.kvk_number}
                    onChange={(e) => setNewCompany({ ...newCompany, kvk_number: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Telefoon</Label>
                  <Input
                    placeholder="+31 20 1234567"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Sector / Industrie</Label>
                  <Input
                    placeholder="bijv. Logistiek of IT"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bedrijfsgrootte</Label>
                  <Input
                    value={newCompany.size}
                    onChange={(e) => setNewCompany({ ...newCompany, size: e.target.value })}
                    placeholder="bijv. 10-50 mdk"
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Vestigingsadres (Straat + Huisnummer)</Label>
                <Input
                  placeholder="bijv. Keizersgracht 421"
                  value={newCompany.street}
                  onChange={(e) => setNewCompany({ ...newCompany, street: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Postcode</Label>
                  <Input
                    placeholder="bijv. 1016 EK"
                    value={newCompany.postal_code}
                    onChange={(e) => setNewCompany({ ...newCompany, postal_code: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Stad</Label>
                  <Input
                    placeholder="bijv. Amsterdam"
                    value={newCompany.city}
                    onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Website</Label>
                <Input
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="https://..."
                  className="text-xs h-9"
                />
              </div>
              <Button onClick={handleAddCompany} className="mt-2 rounded-xl h-10 font-semibold">Bedrijf Opslaan</Button>
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op bedrijfsnaam, sector of domein..."
            className="pl-9 h-10 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

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

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
        <DataTable
          columns={columns}
          data={paginatedCompanies}
          onRowClick={(row) => setViewingCompany(row)}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          {filteredCompanies.length > 0 ? (
            <span>
              Toont{' '}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              tot{' '}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredCompanies.length)}
              </strong>{' '}
              van <strong className="text-foreground">{filteredCompanies.length}</strong>{' '}
              bedrijven
            </span>
          ) : (
            <span>0 bedrijven gevonden</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Vorige
            </Button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              Volgende
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* View Company Details Modal */}
      <Dialog open={!!viewingCompany} onOpenChange={(open) => !open && setViewingCompany(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>{viewingCompany?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {viewingCompany && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Sector</span>
                  <p className="font-semibold text-xs">{viewingCompany.industry || 'Niet gespecificeerd'}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Grootte</span>
                  <p className="font-semibold text-xs">
                    {viewingCompany.size ? `${viewingCompany.size} medewerkers` : 'Niet ingesteld'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Website</span>
                  {viewingCompany.website ? (
                    <a
                      href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-xs text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{viewingCompany.website}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </a>
                  ) : (
                    <p className="font-semibold text-xs text-muted-foreground">Geen website</p>
                  )}
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Telefoonnummer</span>
                  {viewingCompany.phone ? (
                    <a
                      href={`tel:${viewingCompany.phone}`}
                      className="font-semibold text-xs text-emerald-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{viewingCompany.phone}</span>
                    </a>
                  ) : (
                    <p className="font-semibold text-xs text-muted-foreground">Geen telefoonnummer</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">
                    <strong>{viewingCompany.contacts_count || 0}</strong> Gekoppelde Contacten
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">
                    <strong>{viewingCompany.deals_count || 0}</strong> Deals in Pipeline
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => handleDeleteCompany(viewingCompany)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Verwijderen
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewingCompany(null)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const c = viewingCompany;
                      setViewingCompany(null);
                      handleStartEdit(c);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    Bewerken
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Modal */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Bedrijf bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bedrijfsnaam</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sector / Industrie</Label>
                <Input
                  value={editFormData.industry}
                  onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Grootte (bv. 10-50)</Label>
                <Input
                  value={editFormData.size}
                  onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website URL</Label>
              <Input
                value={editFormData.website}
                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                placeholder="https://bedrijf.nl"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefoonnummer</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+31 20 123 4567"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Domeinnaam</Label>
              <Input
                value={editFormData.domain}
                onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
                placeholder="bedrijf.nl"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingCompany(null)}>
              Annuleren
            </Button>
            <Button className="rounded-full" onClick={handleSaveEdit}>
              Wijzigingen opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
