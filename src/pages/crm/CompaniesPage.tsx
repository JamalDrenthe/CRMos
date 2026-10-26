import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { Contact360View } from '@/components/360-view/Contact360View';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import {
  filterRecordsForUser,
  isCoreEcosystemCompany,
  formatCompanyTag,
  CORE_PARTNER_OPTIONS,
} from '@/lib/companyAccess';
import type { Company, Contact } from '@/types';
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
  Hash,
  UserPlus,
  CheckCircle2,
  Tag,
  Copy,
  Sparkles,
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
  const {
    companies,
    contacts,
    addCompany,
    updateCompany,
    deleteCompany,
    ensureEcosystemCompaniesInCRM,
    addCompanyTagToContact,
    inviteContactToCompany,
    acceptCompanyInvitation,
  } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  useEffect(() => {
    ensureEcosystemCompaniesInCRM();
  }, [ensureEcosystemCompaniesInCRM]);

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
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Medewerkers Zoeken & Uitnodigen Modal State
  const [invitingCompany, setInvitingCompany] = useState<Company | null>(null);
  const [employeeTagQuery, setEmployeeTagQuery] = useState('');
  const [employeeFilterMode, setEmployeeFilterMode] = useState<'matching_tag' | 'all_accounts'>('all_accounts');
  const [inviteRole, setInviteRole] = useState('Medewerker');

  const [editFormData, setEditFormData] = useState({
    name: '',
    company_tag: '',
    domain: '',
    industry: '',
    size: '',
    phone: '',
    website: '',
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    company_tag: '',
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
    const q = searchQuery.toLowerCase().trim();
    if (!q) return accessibleCompanies;
    return accessibleCompanies.filter((company) => {
      const compTag = (company.company_tag || formatCompanyTag(company.name)).toLowerCase();
      return (
        company.name.toLowerCase().includes(q) ||
        compTag.includes(q) ||
        company.company_tags?.some((t) => t.toLowerCase().includes(q)) ||
        company.industry?.toLowerCase().includes(q) ||
        company.domain?.toLowerCase().includes(q)
      );
    });
  }, [accessibleCompanies, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  // Zoekresultaten voor Medewerkers Zoeken op Bedrijfstag & Uitnodigen
  const employeeSearchResults = useMemo(() => {
    if (!invitingCompany) return [];
    const targetTag = (invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)).toLowerCase();
    const targetTagPlain = targetTag.replace(/^#/, '');
    const q = employeeTagQuery.trim().toLowerCase();
    const qPlain = q.replace(/^#/, '');

    return contacts
      .map((contact) => {
        const contactCompTags = [
          ...(contact.company_tags || []),
          ...(contact.tags || []).filter((t) => t.startsWith('#')),
        ].map((t) => t.toLowerCase());
        const hasCompanyTag =
          contactCompTags.includes(targetTag) ||
          contactCompTags.includes(`#${targetTagPlain}`) ||
          (contact.company || '').toLowerCase() === invitingCompany.name.toLowerCase();
        const isInvited =
          (contact.invited_companies || []).some(
            (ic) => ic.toLowerCase() === invitingCompany.name.toLowerCase()
          ) ||
          (invitingCompany.invited_member_ids || []).includes(contact.id) ||
          (contact.company_invitations || []).some((inv) => inv.company_id === invitingCompany.id);
        const isMember =
          (contact.member_companies || []).some(
            (mc) => mc.toLowerCase() === invitingCompany.name.toLowerCase()
          ) ||
          (invitingCompany.member_ids || []).includes(contact.id) ||
          (contact.company_invitations || []).some(
            (inv) => inv.company_id === invitingCompany.id && inv.status === 'accepted'
          );

        return {
          contact,
          hasCompanyTag,
          isInvited,
          isMember,
        };
      })
      .filter(({ contact, hasCompanyTag }) => {
        if (employeeFilterMode === 'matching_tag' && !hasCompanyTag) {
          return false;
        }
        if (!q) return true;
        const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
        const emailMatch = (contact.email || '').toLowerCase().includes(q);
        const companyMatch = (contact.company || '').toLowerCase().includes(q);
        const vvcMatch = (contact.vvc_tag || '').toLowerCase().includes(q);
        const tagMatch =
          (contact.company_tags || []).some(
            (t) => t.toLowerCase().includes(q) || t.toLowerCase().replace(/^#/, '').includes(qPlain)
          ) ||
          (contact.tags || []).some(
            (t) => t.toLowerCase().includes(q) || t.toLowerCase().replace(/^#/, '').includes(qPlain)
          );
        return fullName.includes(q) || emailMatch || companyMatch || vvcMatch || tagMatch;
      })
      .sort((a, b) => {
        if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
        if (a.hasCompanyTag !== b.hasCompanyTag) return a.hasCompanyTag ? -1 : 1;
        if (a.isInvited !== b.isInvited) return a.isInvited ? -1 : 1;
        return 0;
      });
  }, [contacts, invitingCompany, employeeTagQuery, employeeFilterMode]);

  const handleOpenInviteModal = (company: Company, defaultSearchTag = '') => {
    setInvitingCompany(company);
    setEmployeeTagQuery(defaultSearchTag);
    setEmployeeFilterMode('all_accounts');
  };

  const handleInviteEmployee = (company: Company, contact: Contact) => {
    const inv = inviteContactToCompany(company.id, contact.id, inviteRole);
    if (inv) {
      toast.success(
        `${contact.first_name} ${contact.last_name} is uitgenodigd om bij ${company.name} (${inv.company_tag}) te komen als ${inviteRole}!`
      );
      // Sync viewingCompany / invitingCompany reference from store
      const refreshed = useCRMStore.getState().companies.find((c) => c.id === company.id);
      if (refreshed) {
        setInvitingCompany(refreshed);
        if (viewingCompany?.id === refreshed.id) setViewingCompany(refreshed);
      }
    }
  };

  const handleAddCompany = () => {
    if (!newCompany.name.trim()) {
      toast.error('Vul een bedrijfsnaam in');
      return;
    }
    const generatedTag = formatCompanyTag(newCompany.company_tag.trim() || newCompany.name.trim());
    const created = addCompany({
      name: newCompany.name.trim(),
      company_tag: generatedTag,
      company_tags: [generatedTag],
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
      allowed_companies: isCorePartner ? [...CORE_PARTNER_OPTIONS] : [userCompanyName],
      contacts_count: 0,
      deals_count: 0,
    });
    setIsAddDialogOpen(false);
    setNewCompany({
      name: '',
      company_tag: '',
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
    toast.success(`Bedrijf "${created.name}" opgeslagen met bedrijfstag ${created.company_tag}! Je kunt direct medewerkers zoeken en uitnodigen.`);
    setInvitingCompany(created);
  };

  const handleStartEdit = (company: Company) => {
    setEditingCompany(company);
    setEditFormData({
      name: company.name,
      company_tag: company.company_tag || formatCompanyTag(company.name),
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.size || '',
      phone: company.phone || '',
      website: company.website || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingCompany) return;
    const updatedTag = formatCompanyTag(editFormData.company_tag.trim() || editFormData.name.trim() || editingCompany.name);
    updateCompany(editingCompany.id, {
      name: editFormData.name.trim() || editingCompany.name,
      company_tag: updatedTag,
      company_tags: Array.from(new Set([updatedTag, ...(editingCompany.company_tags || [])])),
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
              company_tag: updatedTag,
              domain: editFormData.domain.trim() || undefined,
              industry: editFormData.industry.trim() || undefined,
              size: editFormData.size.trim() || undefined,
              phone: editFormData.phone.trim() || undefined,
              website: editFormData.website.trim() || undefined,
            }
          : null
      );
    }
    toast.success('Bedrijfsgegevens en bedrijfstag succesvol bijgewerkt');
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
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-foreground">{row.original.name}</p>
              {row.original.is_crmos_core && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Core
                </Badge>
              )}
            </div>
            {row.original.domain && (
              <p className="text-xs text-muted-foreground">{row.original.domain}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'company_tag',
      header: 'Bedrijfstag',
      cell: ({ row }: { row: { original: Company } }) => {
        const compTag = row.original.company_tag || formatCompanyTag(row.original.name);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenInviteModal(row.original, compTag);
            }}
            title={`Zoek en nodig medewerkers uit met bedrijfstag ${compTag}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-all cursor-pointer"
          >
            <Hash className="h-3 w-3 text-sky-500 shrink-0" />
            <span>{compTag.replace(/^#/, '')}</span>
          </button>
        );
      },
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
      header: 'Medewerkers & Contacten',
      cell: ({ row }: { row: { original: Company } }) => {
        const compTag = (row.original.company_tag || formatCompanyTag(row.original.name)).toLowerCase();
        const taggedCount = contacts.filter(
          (c) =>
            c.company_id === row.original.id ||
            (c.company || '').toLowerCase() === row.original.name.toLowerCase() ||
            (c.company_tags || []).some((t) => t.toLowerCase() === compTag) ||
            (c.tags || []).some((t) => t.toLowerCase() === compTag)
        ).length;
        const count = Math.max(row.original.contacts_count || 0, taggedCount);
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{count}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInviteModal(row.original);
              }}
              className="h-7 px-2.5 rounded-full text-[11px] gap-1 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
            >
              <UserPlus className="h-3 w-3" />
              <span>Medewerkers zoeken</span>
            </Button>
          </div>
        );
      },
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => handleOpenInviteModal(row.original)}
                className="gap-2 cursor-pointer text-sky-600 dark:text-sky-400 font-medium"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Medewerkers zoeken &amp; uitnodigen</span>
              </DropdownMenuItem>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Bedrijven (Companies)</h1>
          <p className="text-muted-foreground text-sm">
            Beheer alle 13 CRMos ecosysteem-bedrijven en aangesloten organisaties, zoek medewerkers op bedrijfstag en nodig ze uit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const firstCompany = accessibleCompanies[0] || companies[0];
              if (firstCompany) handleOpenInviteModal(firstCompany);
            }}
            className="rounded-xl border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Medewerkers Zoeken &amp; Uitnodigen</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Nieuw Bedrijf Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle>Nieuw Bedrijf Toevoegen aan CRM</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-3 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Bedrijfsnaam *</Label>
                    <Input
                      placeholder="bijv. Spontiva of Jansen B.V."
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          name: e.target.value,
                          company_tag: newCompany.company_tag
                            ? newCompany.company_tag
                            : formatCompanyTag(e.target.value),
                        })
                      }
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Hash className="h-3 w-3 text-sky-500" />
                      <span>Unieke Bedrijfstag (voor medewerkers)</span>
                    </Label>
                    <Input
                      placeholder="#bedrijfsnaam"
                      value={newCompany.company_tag || (newCompany.name ? formatCompanyTag(newCompany.name) : '')}
                      onChange={(e) => setNewCompany({ ...newCompany, company_tag: e.target.value })}
                      className="text-xs h-9 font-mono text-sky-600 dark:text-sky-400"
                    />
                  </div>
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
                <Button onClick={handleAddCompany} className="mt-2 rounded-xl h-10 font-semibold">
                  Bedrijf Opslaan &amp; Medewerkers Zoeken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Company Isolation / Ecosystem Badge Banner + 13 Core Bedrijfstags Snelbalk */}
      <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                    ? `CRMos Core Ecosysteem (${accessibleCompanies.length} bedrijven)`
                    : `${userCompanyName} Workspace (${accessibleCompanies.length} bedrijven)`}
                </p>
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  {isSuperAdmin
                    ? (adminCompanyFilter === 'all' ? 'Alle Bedrijven' : adminCompanyFilter)
                    : userCompanyName}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Klik op een bedrijfstag hieronder om direct te filteren of medewerkers te zoeken en uit te nodigen voor dat bedrijf.
              </p>
            </div>
          </div>
        </div>

        {/* 13 Core Bedrijven Tag Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
              !searchQuery
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-background/60 text-muted-foreground border-border/60 hover:text-foreground'
            }`}
          >
            Alle ({accessibleCompanies.length})
          </button>
          {accessibleCompanies
            .filter((c) => c.is_crmos_core)
            .map((coreComp) => {
              const tag = coreComp.company_tag || formatCompanyTag(coreComp.name);
              const isSelected = searchQuery.toLowerCase() === tag.toLowerCase() || searchQuery.toLowerCase() === coreComp.name.toLowerCase();
              return (
                <button
                  key={coreComp.id}
                  type="button"
                  onClick={() => setSearchQuery(isSelected ? '' : tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-semibold'
                      : 'bg-background/60 text-muted-foreground border-border/60 hover:border-sky-500/40 hover:text-foreground'
                  }`}
                >
                  <span className="font-mono text-[10px] text-sky-500">{tag}</span>
                  <span className="truncate max-w-[140px]">{coreComp.name}</span>
                </button>
              );
            })}
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
            <p className="text-xs text-muted-foreground">Ecosysteem Bedrijven</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {accessibleCompanies.filter((c) => c.is_crmos_core).length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Accounts met Bedrijfstag</p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {contacts.filter((c) => (c.company_tags && c.company_tags.length > 0) || (c.tags && c.tags.some((t) => t.startsWith('#')))).length}
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
            placeholder="Zoek op bedrijfsnaam, #bedrijfstag (bijv. #vvc, #spontiva), sector of domein..."
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
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>{viewingCompany?.name}</span>
              </div>
              {viewingCompany && (
                <Badge variant="outline" className="font-mono text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                  {viewingCompany.company_tag || formatCompanyTag(viewingCompany.name)}
                </Badge>
              )}
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

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-sky-500/[0.06] border border-sky-500/25">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-sky-500" />
                    <span>Bedrijfstag: {viewingCompany.company_tag || formatCompanyTag(viewingCompany.name)}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Zoek accounts met deze tag en nodig ze uit om bij {viewingCompany.name} te komen.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const comp = viewingCompany;
                    setViewingCompany(null);
                    handleOpenInviteModal(comp);
                  }}
                  className="rounded-full text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white gap-1.5 shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Medewerkers Zoeken</span>
                </Button>
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
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-sky-500" />
                <span>Bedrijfstag (voor medewerkers zoeken &amp; koppelen)</span>
              </Label>
              <Input
                value={editFormData.company_tag}
                onChange={(e) => setEditFormData({ ...editFormData, company_tag: e.target.value })}
                placeholder="#bedrijfstag"
                className="rounded-xl font-mono text-sky-600 dark:text-sky-400"
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

      {/* ===================================================================== */}
      {/* MEDEWERKERS ZOEKEN OP BEDRIJFSTAG & UITNODIGEN MODAL */}
      {/* ===================================================================== */}
      <Dialog open={!!invitingCompany} onOpenChange={(open) => !open && setInvitingCompany(null)}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[88vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold block">
                    Medewerkers Zoeken &amp; Uitnodigen
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Zoek accounts op bedrijfstag, VVC-tag, naam of e-mail en nodig ze uit voor{' '}
                    <strong className="text-foreground">{invitingCompany?.name}</strong>
                  </span>
                </div>
              </div>
              {invitingCompany && (
                <button
                  type="button"
                  onClick={() => {
                    const tag = invitingCompany.company_tag || formatCompanyTag(invitingCompany.name);
                    navigator.clipboard.writeText(tag);
                    toast.success(`Bedrijfstag gekopieerd: ${tag}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 cursor-pointer"
                >
                  <Hash className="h-3.5 w-3.5 text-sky-500" />
                  <span>{(invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)).replace(/^#/, '')}</span>
                  <Copy className="h-3 w-3 opacity-60" />
                </button>
              )}
            </DialogTitle>
          </DialogHeader>

          {invitingCompany && (
            <div className="flex-1 flex flex-col gap-3.5 overflow-hidden py-1">
              {/* Bedrijf Kiezer + Rol Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Actief Bedrijf (waarvoor je uitnodigt)
                  </Label>
                  <select
                    value={invitingCompany.id}
                    onChange={(e) => {
                      const found = companies.find((c) => c.id === e.target.value);
                      if (found) setInvitingCompany(found);
                    }}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    {accessibleCompanies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.company_tag || formatCompanyTag(comp.name)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Rol / Functie bij Uitnodiging
                  </Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    <option value="Medewerker">Medewerker</option>
                    <option value="Sales Agent">Sales Agent / Field</option>
                    <option value="Callcenter Agent">Callcenter Agent</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Teamlead / Manager">Teamlead / Manager</option>
                    <option value="Partner / Adviseur">Partner / Adviseur</option>
                  </select>
                </div>
              </div>

              {/* Zoekbalk op Bedrijfstag / Naam / VVC Tag + Filter Modus */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={employeeTagQuery}
                    onChange={(e) => setEmployeeTagQuery(e.target.value)}
                    placeholder={`Zoek op bedrijfstag (bijv. ${invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)}), naam, e-mail of VVC tag...`}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={employeeFilterMode === 'matching_tag' ? 'default' : 'outline'}
                    onClick={() =>
                      setEmployeeFilterMode((m) => (m === 'matching_tag' ? 'all_accounts' : 'matching_tag'))
                    }
                    className="h-9 rounded-xl text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      Alleen met {invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Resultaten Lijst van Accounts & Contacten */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[42vh]">
                {employeeSearchResults.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-border/70 space-y-2">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-foreground">
                      Geen accounts gevonden met deze filter
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                      Schakel "Alleen met {invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)}" uit om alle accounts in het CRM te doorzoeken of voeg de bedrijfstag toe aan een account.
                    </p>
                    {employeeFilterMode === 'matching_tag' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEmployeeFilterMode('all_accounts')}
                        className="rounded-full text-xs mt-1"
                      >
                        Toon alle accounts ({contacts.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  employeeSearchResults.slice(0, 40).map(({ contact, hasCompanyTag, isInvited, isMember }) => {
                    const compTag = invitingCompany.company_tag || formatCompanyTag(invitingCompany.name);
                    const allContactCompanyTags = Array.from(
                      new Set([
                        ...(contact.company_tags || []),
                        ...(contact.tags || []).filter((t) => t.startsWith('#')),
                      ])
                    );

                    return (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          hasCompanyTag
                            ? 'bg-sky-500/[0.05] border-sky-500/35'
                            : 'bg-card border-border/60 hover:border-border'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-foreground">
                              {contact.first_name} {contact.last_name}
                            </span>
                            {hasCompanyTag && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold"
                              >
                                Match op {compTag}
                              </Badge>
                            )}
                            {isMember && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                              >
                                Medewerker van {invitingCompany.name}
                              </Badge>
                            )}
                            {!isMember && isInvited && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold"
                              >
                                Uitgenodigd ({inviteRole})
                              </Badge>
                            )}
                            {contact.vvc_tag && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <Tag className="h-2.5 w-2.5" />
                                {contact.vvc_tag}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground truncate">
                            {contact.email} {contact.company ? `• Huidig bedrijf: ${contact.company}` : ''}
                          </p>

                          {allContactCompanyTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {allContactCompanyTags.map((t) => (
                                <span
                                  key={t}
                                  className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedContactId(contact.id)}
                            className="h-8 rounded-full text-[11px] px-2.5 gap-1 text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Profiel &amp; Tags</span>
                          </Button>
                          {!hasCompanyTag && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                addCompanyTagToContact(contact.id, compTag);
                                toast.success(
                                  `Bedrijfstag ${compTag} gekoppeld aan ${contact.first_name} ${contact.last_name}`
                                );
                              }}
                              className="h-8 rounded-full text-[11px] px-2.5 gap-1 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                            >
                              <Hash className="h-3 w-3" />
                              <span>Tag {compTag}</span>
                            </Button>
                          )}

                          {isMember ? (
                            <Badge className="bg-emerald-600 text-white text-[11px] px-3 py-1 rounded-full gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Aangesloten</span>
                            </Badge>
                          ) : isInvited ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const inv = (contact.company_invitations || []).find(
                                  (i) => i.company_id === invitingCompany.id
                                );
                                if (inv) {
                                  acceptCompanyInvitation(contact.id, inv.id);
                                  toast.success(
                                    `${contact.first_name} ${contact.last_name} is nu direct bevestigd als medewerker van ${invitingCompany.name}!`
                                  );
                                } else {
                                  handleInviteEmployee(invitingCompany, contact);
                                }
                              }}
                              className="h-8 rounded-full text-[11px] px-3 gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Bevestig Lidmaatschap</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleInviteEmployee(invitingCompany, contact)}
                              className="h-8 rounded-full text-[11px] px-3.5 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>Uitnodigen bij {invitingCompany.name}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {employeeSearchResults.length} accounts gevonden • Bedrijfstag:{' '}
                  <strong className="font-mono text-sky-600 dark:text-sky-400">
                    {invitingCompany.company_tag || formatCompanyTag(invitingCompany.name)}
                  </strong>
                </span>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setInvitingCompany(null)}>
                  Sluiten
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Volledig Contactprofiel & Tags Slide-Over */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
