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
import {
  smartSearchContacts,
  isReferredByJamal,
  CORE_JAMAL_REFERRAL_LEADERS,
} from '@/services/crmSearchEngine';
import type { Contact } from '@/types';
import { getVvcTag, getVvcTagStats } from '@/services/vvcTagService';
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Building2,
  ShieldCheck,
  Lock,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  Tag,
  Copy,
  RefreshCw,
  Users,
  Crown,
  Sparkles,
  Clock,
  X,
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

type ContactFilterMode =
  | 'all'
  | 'core_leaders'
  | 'jamal_referred'
  | 'active_team'
  | 'passive_team'
  | 'team_requests';

export function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    contacts,
    companies,
    teams,
    addContact,
    deleteContact,
    ensureVvcTagsOnAllContacts,
    setContactTeamStatus,
    addTagToContact,
  } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();
  const { addAuditLog } = useEnhancedStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterMode, setFilterMode] = useState<ContactFilterMode>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    searchParams.get('id')
  );

  // Sync selectedContactId when navigated from GlobalSearch or URL ?id=...
  useEffect(() => {
    const paramId = searchParams.get('id');
    if (paramId) {
      setSelectedContactId(paramId);
    }
  }, [searchParams]);
  const [dialerContact, setDialerContact] = useState<Contact | null>(null);
  const [quickTagContactId, setQuickTagContactId] = useState<string | null>(null);
  const [quickTagValue, setQuickTagValue] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customTagsString, setCustomTagsString] = useState('');
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: 'VVC (Verdienende Vrienden Club)',
    company_id: '',
    title: 'Sales Representative',
    status: 'lead' as Contact['status'],
    source: 'Referral / Recruit',
    team_id: 'team_jamal_drenthe',
    team_name: 'Team Jamal Drenthe',
    team_status: 'active' as 'active' | 'passive',
    referred_by_name: 'Jamal Drenthe',
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

  // VVC Tag Stats for accessible contacts
  const vvcStats = useMemo(() => {
    return getVvcTagStats(accessibleContacts);
  }, [accessibleContacts]);

  // Core 7 referral leaders lookup (Reyhan, Julius, Jayden, Deniz, Boas, Fawzan, Ricardo)
  const coreLeaderContacts = useMemo(() => {
    const leaderFirstNames = new Set(
      CORE_JAMAL_REFERRAL_LEADERS.map((l) => l.first_name.toLowerCase())
    );
    return CORE_JAMAL_REFERRAL_LEADERS.map((spec) => {
      const found = accessibleContacts.find(
        (c) =>
          c.id === spec.id ||
          c.first_name.toLowerCase() === spec.first_name.toLowerCase() ||
          `${c.first_name} ${c.last_name}`.toLowerCase().startsWith(spec.first_name.toLowerCase())
      );
      const teamCount = accessibleContacts.filter(
        (c) =>
          c.team_id === spec.team_id ||
          c.team_name?.toLowerCase() === spec.team_name.toLowerCase()
      ).length;
      return {
        spec,
        contact: found,
        teamCount,
        isPresent: Boolean(found || leaderFirstNames.has(spec.first_name.toLowerCase())),
      };
    });
  }, [accessibleContacts]);

  const handleSyncVvcTags = useCallback(() => {
    const updated = ensureVvcTagsOnAllContacts();
    if (updated > 0) {
      toast.success(`${updated} contact(en) succesvol voorzien van een unieke VVC communicatie tag!`);
    } else {
      toast.info('Alle contacten hebben al een unieke VVC communicatie tag.');
    }
  }, [ensureVvcTagsOnAllContacts]);

  // Apply team/mode filter + Smart Search Engine
  const filteredContacts = useMemo(() => {
    const coreFirstNames = new Set(
      CORE_JAMAL_REFERRAL_LEADERS.map((l) => l.first_name.toLowerCase())
    );

    const baseFiltered = accessibleContacts.filter((c) => {
      if (selectedTeamFilter !== 'all') {
        if (c.team_id !== selectedTeamFilter && c.team_name !== selectedTeamFilter) {
          return false;
        }
      }

      if (filterMode === 'core_leaders') {
        const fn = (c.first_name || '').trim().toLowerCase().split(/\s+/)[0];
        return coreFirstNames.has(fn) || c.team_role === 'leader';
      }
      if (filterMode === 'jamal_referred') {
        return Boolean(c.can_start_team || isReferredByJamal(c.referred_by_name));
      }
      if (filterMode === 'active_team') {
        return (c.team_status || 'active') === 'active';
      }
      if (filterMode === 'passive_team') {
        return c.team_status === 'passive';
      }
      if (filterMode === 'team_requests') {
        return c.team_request_status === 'pending';
      }
      return true;
    });

    return smartSearchContacts(baseFiltered, searchQuery);
  }, [accessibleContacts, selectedTeamFilter, filterMode, searchQuery]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, selectedTeamFilter]);

  // Paginated contacts slice
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  const handleAddContact = () => {
    if (!newContact.first_name.trim()) {
      toast.error('Vul minimaal een voornaam in');
      return;
    }
    const extraTags = customTagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const jamalReferred = isReferredByJamal(newContact.referred_by_name);

    const contact = addContact({
      ...newContact,
      can_start_team: jamalReferred,
      team_role: 'member',
      team_request_status: 'none',
      tags: Array.from(
        new Set([
          ...newContact.tags,
          ...extraTags,
          newContact.team_name,
          newContact.team_status === 'active' ? 'Actief Team' : 'Passief Team',
          ...(jamalReferred ? ['Door Jamal Drenthe', 'Mag Team Starten'] : [`Via ${newContact.referred_by_name}`]),
        ])
      ),
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
    setCustomTagsString('');
    setNewContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: 'VVC (Verdienende Vrienden Club)',
      company_id: '',
      title: 'Sales Representative',
      status: 'lead',
      source: 'Referral / Recruit',
      team_id: 'team_jamal_drenthe',
      team_name: 'Team Jamal Drenthe',
      team_status: 'active',
      referred_by_name: 'Jamal Drenthe',
      tags: [],
      custom_fields: {},
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
    });
    toast.success(`Contact ${contact.first_name} ${contact.last_name} opgeslagen in ${contact.team_name}`);
  };

  const handleDeleteContact = useCallback(
    (id: string) => {
      deleteContact(id);
      toast.success('Contact verwijderd');
    },
    [deleteContact]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Naam & Rol',
        cell: ({ row }: { row: { original: Contact } }) => {
          const isLeader = row.original.team_role === 'leader';
          const jamalRef = row.original.can_start_team || isReferredByJamal(row.original.referred_by_name);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border/40">
                <AvatarImage src={row.original.avatar} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {(row.original.first_name || 'C')[0]}
                  {(row.original.last_name || row.original.first_name?.slice(1) || 'R')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-foreground">
                    {row.original.first_name} {row.original.last_name}
                  </p>
                  {isLeader && (
                    <Badge className="bg-violet-600 text-white text-[9px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Teamleider</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{row.original.title || 'Team Member'}</span>
                  {jamalRef && !isLeader && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      • Mag team starten
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'team',
        header: 'Team & Status (Actief/Passief)',
        cell: ({ row }: { row: { original: Contact } }) => {
          const teamName = row.original.team_name || 'Team Jamal Drenthe';
          const status = row.original.team_status || 'active';
          return (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamFilter(row.original.team_id || 'all');
                }}
                title={`Filter op ${teamName}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <span>{teamName}</span>
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = status === 'active' ? 'passive' : 'active';
                    setContactTeamStatus(row.original.id, nextStatus);
                    toast.success(
                      `${row.original.first_name} gewisseld naar ${
                        nextStatus === 'active' ? 'Actief Team' : 'Passief Team'
                      }`
                    );
                  }}
                  title="Klik om direct te wisselen tussen Actief Team en Passief Team"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  {status === 'active' ? (
                    <>
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Actief Team</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-2.5 w-2.5" />
                      <span>Passief Team</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'referred_by',
        header: 'Aangeleverd door (Team-Recht)',
        cell: ({ row }: { row: { original: Contact } }) => {
          const referrer = row.original.referred_by_name || 'Jamal Drenthe';
          const jamalRef = row.original.can_start_team || isReferredByJamal(referrer);
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span>{referrer}</span>
              </div>
              {jamalRef ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 font-semibold"
                >
                  Direct Team-Recht
                </Badge>
              ) : row.original.team_request_status === 'pending' ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold"
                >
                  Team Aangevraagd
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground block">
                  Team op aanvraag
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'tags',
        header: 'Alle Tags & Zelf Toevoegen',
        cell: ({ row }: { row: { original: Contact } }) => {
          const vvcTag = getVvcTag(row.original);
          const allTags = Array.from(
            new Set([
              ...(vvcTag ? [vvcTag] : []),
              ...(row.original.company_tags || []),
              ...(row.original.tags || []),
            ])
          ).filter(Boolean);

          const isQuickAdding = quickTagContactId === row.original.id;

          return (
            <div className="space-y-1.5 max-w-[260px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-wrap items-center gap-1">
                {allTags.slice(0, 4).map((tag) => {
                  const isVvc = tag.toLowerCase().startsWith('vvc-');
                  const isComp = tag.startsWith('#');
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      title={`Zoek op tag ${tag}`}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                        isVvc
                          ? 'font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                          : isComp
                          ? 'font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25'
                          : 'bg-muted/60 text-foreground border-border/60 hover:bg-muted'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
                {allTags.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setSelectedContactId(row.original.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                  >
                    +{allTags.length - 4} meer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setQuickTagContactId(isQuickAdding ? null : row.original.id);
                    setQuickTagValue('');
                  }}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-dashed border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>Tag</span>
                </button>
              </div>

              {isQuickAdding && (
                <div className="flex items-center gap-1 pt-0.5">
                  <Input
                    value={quickTagValue}
                    onChange={(e) => setQuickTagValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickTagValue.trim()) {
                        e.preventDefault();
                        addTagToContact(row.original.id, quickTagValue.trim());
                        toast.success(`Tag "${quickTagValue.trim()}" toegevoegd aan ${row.original.first_name}`);
                        setQuickTagValue('');
                        setQuickTagContactId(null);
                      }
                    }}
                    placeholder="Nieuwe tag..."
                    className="h-6 text-[11px] px-2 rounded-md"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!quickTagValue.trim()) return;
                      addTagToContact(row.original.id, quickTagValue.trim());
                      toast.success(`Tag "${quickTagValue.trim()}" toegevoegd aan ${row.original.first_name}`);
                      setQuickTagValue('');
                      setQuickTagContactId(null);
                    }}
                    className="h-6 px-2 text-[10px] rounded-md"
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'Telefoon & E-mail',
        cell: ({ row }: { row: { original: Contact } }) => (
          <div className="space-y-1">
            {row.original.phone ? (
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
            ) : (
              <span className="text-xs text-muted-foreground block">Geen telefoon</span>
            )}
            {row.original.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${row.original.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline text-[11px] text-muted-foreground truncate max-w-[160px]"
                >
                  {row.original.email}
                </a>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Bedrijf & VVC Tag',
        cell: ({ row }: { row: { original: Contact } }) => {
          const vvcTag = getVvcTag(row.original);
          return (
            <div className="space-y-1">
              {row.original.company ? (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground font-medium truncate max-w-[140px]">
                    {row.original.company}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
              {vvcTag && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(vvcTag);
                    toast.success(`VVC communicatie tag gekopieerd: ${vvcTag}`);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20"
                >
                  <Tag className="h-2.5 w-2.5 text-amber-500" />
                  <span>{vvcTag}</span>
                  <Copy className="h-2.5 w-2.5 opacity-60" />
                </button>
              )}
            </div>
          );
        },
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
              title="Open Volledig 360° Profiel & Tags"
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
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuItem onClick={() => setSelectedContactId(row.original.id)}>
                  Volledig Profiel &amp; Tags Openen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = row.original.team_status === 'passive' ? 'active' : 'passive';
                    setContactTeamStatus(row.original.id, next);
                    toast.success(
                      `${row.original.first_name} gewisseld naar ${
                        next === 'active' ? 'Actief Team' : 'Passief Team'
                      }`
                    );
                  }}
                >
                  Wissel Actief / Passief Team
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
    ],
    [navigate, handleDeleteContact, setContactTeamStatus, addTagToContact, quickTagContactId, quickTagValue]
  );

  const activeTeamContactsCount = useMemo(
    () => accessibleContacts.filter((c) => (c.team_status || 'active') === 'active').length,
    [accessibleContacts]
  );
  const passiveTeamContactsCount = useMemo(
    () => accessibleContacts.filter((c) => c.team_status === 'passive').length,
    [accessibleContacts]
  );
  const jamalReferredCount = useMemo(
    () =>
      accessibleContacts.filter((c) => c.can_start_team || isReferredByJamal(c.referred_by_name))
        .length,
    [accessibleContacts]
  );
  const pendingTeamRequestsCount = useMemo(
    () => accessibleContacts.filter((c) => c.team_request_status === 'pending').length,
    [accessibleContacts]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contacten &amp; Referral Teams</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Iedereen komt binnen via referral / recruit en is ingedeeld in een Actief of Passief Team. Personen aangeleverd door Jamal Drenthe kunnen direct een eigen team starten.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm gap-1.5 h-10 px-5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              <span>Nieuw Contact / Recruit</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Contactpersoon / Recruit toevoegen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Voornaam</Label>
                  <Input
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                    placeholder="Bijv. Reyhan"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Achternaam</Label>
                  <Input
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                    placeholder="Bijv. Salesmates"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Team & Actief/Passief Indeling */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Indelen in Team
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs h-9"
                    value={newContact.team_id}
                    onChange={(e) => {
                      const chosen = teams.find((t) => t.id === e.target.value);
                      setNewContact({
                        ...newContact,
                        team_id: e.target.value,
                        team_name: chosen ? chosen.name : 'Team Jamal Drenthe',
                        team_status: chosen ? chosen.status : newContact.team_status,
                      });
                    }}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Team Optie (Actief / Passief)
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs h-9"
                    value={newContact.team_status}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        team_status: e.target.value as 'active' | 'passive',
                      })
                    }
                  >
                    <option value="active">Actief Team</option>
                    <option value="passive">Passief Team</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1 pt-1">
                  <Label className="text-xs font-semibold">
                    Aangeleverd door (Referrer / Recruiter)
                  </Label>
                  <Input
                    value={newContact.referred_by_name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, referred_by_name: e.target.value })
                    }
                    placeholder="Jamal Drenthe (geeft direct recht om een team te starten)"
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {isReferredByJamal(newContact.referred_by_name)
                      ? '✓ Aangeleverd door Jamal Drenthe: Dit contact mag direct een eigen team beginnen.'
                      : 'ℹ Niet door Jamal Drenthe aangeleverd: Dit contact moet een eigen team eerst aanvragen.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Klantbedrijf (Relatie)</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                    value={newContact.company_id}
                    onChange={(e) => {
                      const compId = e.target.value;
                      const selected = companies.find((c) => c.id === compId);
                      setNewContact({
                        ...newContact,
                        company_id: compId,
                        company: selected ? selected.name : newContact.company,
                      });
                    }}
                  >
                    <option value="">-- Kies bedrijf --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bedrijfsnaam</Label>
                  <Input
                    placeholder="Bedrijfsnaam van het contact"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Functietitel / Rol</Label>
                  <Input
                    placeholder="bijv. Teamleider / Closer"
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Relatiestatus</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                    value={newContact.status}
                    onChange={(e) =>
                      setNewContact({ ...newContact, status: e.target.value as Contact['status'] })
                    }
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Klant (Customer)</option>
                    <option value="partner">Partner / Teamleider</option>
                    <option value="churned">Inactief / Churned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Extra Tags (komma-gescheiden)</Label>
                <Input
                  placeholder="bijv. Salesmates, Closer, #vvc, Top Recruit"
                  value={customTagsString}
                  onChange={(e) => setCustomTagsString(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <Button onClick={handleAddContact} className="mt-1 rounded-xl h-10 font-semibold">
                Contact &amp; Team Indeling Opslaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 7 Kernteamleiders Status Card (Reyhan, Julius, Jayden, Deniz, Boas, Fawzan, Ricardo) */}
      <Card className="rounded-2xl border-violet-500/30 bg-gradient-to-r from-violet-500/[0.06] via-primary/[0.03] to-transparent shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Kernteamleiders Aangeleverd door Jamal Drenthe (Direct Team-Recht)
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                Alle 7 aanwezig in CRM
              </Badge>
            </div>
            <Button
              size="sm"
              variant={filterMode === 'core_leaders' ? 'default' : 'outline'}
              onClick={() => setFilterMode(filterMode === 'core_leaders' ? 'all' : 'core_leaders')}
              className="h-7 text-xs rounded-xl px-3"
            >
              {filterMode === 'core_leaders' ? 'Toon Alle Contacten' : 'Filter op deze 7 Teamleiders'}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {coreLeaderContacts.map(({ spec, contact, teamCount }) => (
              <div
                key={spec.id}
                onClick={() => {
                  if (contact) {
                    setSelectedContactId(contact.id);
                  } else {
                    setSearchQuery(spec.first_name);
                  }
                }}
                className="p-2.5 rounded-xl bg-card/90 border border-border/60 hover:border-violet-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {spec.first_name}
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0">
                    Actief
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {spec.team_name} ({teamCount} leden)
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                  {contact?.phone || spec.phone}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Isolation & VVC Sync Banner */}
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
                  ? `Admin Masterview (${accessibleContacts.length} unieke contacten in teams)`
                  : isCorePartner
                  ? `CRMos Core Dataset (${accessibleContacts.length} contacten)`
                  : `${userCompanyName} Workspace (${accessibleContacts.length} contacten)`}
              </p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {isSuperAdmin
                  ? adminCompanyFilter === 'all'
                    ? 'Alle Bedrijven'
                    : adminCompanyFilter
                  : userCompanyName}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Klik op een contactrij om het volledige profiel met alle gegevens, team-opties en zelf toe te voegen tags te openen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
            <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              VVC API Link: {vvcStats.taggedCount}/{vvcStats.total} ({vvcStats.percentage}%)
            </span>
          </div>
          {vvcStats.percentage < 100 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncVvcTags}
              className="h-8 rounded-xl text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Koppel Alle Tags</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards (Inclusief Actieve & Passieve Teams + Jamal Drenthe Referrals) */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card
          onClick={() => setFilterMode('all')}
          className={`rounded-2xl border-border/60 shadow-xs cursor-pointer transition-all ${
            filterMode === 'all' ? 'ring-2 ring-primary' : 'hover:border-primary/40'
          }`}
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Totaal in Teams</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {accessibleContacts.length.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'active_team' ? 'all' : 'active_team')}
          className={`rounded-2xl border-emerald-500/30 bg-emerald-500/[0.03] shadow-xs cursor-pointer transition-all ${
            filterMode === 'active_team' ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-500/60'
          }`}
        >
          <CardContent className="p-4">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Actieve Teams</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {activeTeamContactsCount.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'passive_team' ? 'all' : 'passive_team')}
          className={`rounded-2xl border-amber-500/30 bg-amber-500/[0.03] shadow-xs cursor-pointer transition-all ${
            filterMode === 'passive_team' ? 'ring-2 ring-amber-500' : 'hover:border-amber-500/60'
          }`}
        >
          <CardContent className="p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Passieve Teams</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {passiveTeamContactsCount.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'jamal_referred' ? 'all' : 'jamal_referred')}
          className={`rounded-2xl border-violet-500/30 bg-violet-500/[0.03] shadow-xs cursor-pointer transition-all ${
            filterMode === 'jamal_referred' ? 'ring-2 ring-violet-500' : 'hover:border-violet-500/60'
          }`}
        >
          <CardContent className="p-4">
            <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold">
              Door Jamal Drenthe (Team-Recht)
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {jamalReferredCount.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterMode(filterMode === 'team_requests' ? 'all' : 'team_requests')}
          className={`rounded-2xl border-border/60 shadow-xs cursor-pointer transition-all ${
            filterMode === 'team_requests' ? 'ring-2 ring-primary' : 'hover:border-primary/40'
          }`}
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Team Aanvragen</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {pendingTeamRequestsCount.toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extreem Goede Search & Team Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Extreem snel zoeken op naam (Reyhan, Julius, Jayden, Deniz, Boas, Fawzan, Ricardo), 06-nummer, #bedrijfstag, VVC-tag, team of aanbrenger..."
              className="pl-10 pr-9 h-11 rounded-2xl text-xs sm:text-sm border-primary/25 shadow-xs focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Team Selector */}
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground"
            >
              <option value="all">Alle Teams ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status === 'active' ? 'Actief' : 'Passief'})
                </option>
              ))}
            </select>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground font-medium"
              >
                <option value={25}>25 / pag</option>
                <option value={50}>50 / pag</option>
                <option value={100}>100 / pag</option>
              </select>
            </div>
          </div>
        </div>

        {/* Snel-zoek chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Snel zoeken:</span>
          {[
            'Reyhan',
            'Julius',
            'Jayden',
            'Deniz',
            'Boas',
            'Fawzan',
            'Ricardo',
            'Jamal Drenthe',
            'Actief Team',
            'Passief Team',
            '#vvc',
            '#spontiva',
          ].map((chip) => {
            const active = searchQuery.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSearchQuery(active ? '' : chip)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card hover:bg-muted/70 text-foreground border-border/60'
                }`}
              >
                {chip}
              </button>
            );
          })}
          {(searchQuery || filterMode !== 'all' || selectedTeamFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
                setSelectedTeamFilter('all');
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Filters wissen
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
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
