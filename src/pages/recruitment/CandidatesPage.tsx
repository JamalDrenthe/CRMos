import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/common/DataTable';
import { Contact360View } from '@/components/360-view/Contact360View';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import { smartSearchCandidates } from '@/services/crmSearchEngine';
import type { Candidate } from '@/types';
import { getVvcTag } from '@/services/vvcTagService';
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Building2,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Trash2,
  Eye,
  CheckCircle2,
  Tag,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

const stages = [
  { id: 'new', name: 'Nieuw', color: 'bg-gray-500' },
  { id: 'screening', name: 'Screening', color: 'bg-blue-500' },
  { id: 'interview', name: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', name: 'Aanbod', color: 'bg-orange-500' },
  { id: 'hired', name: 'Aangenomen', color: 'bg-green-500' },
  { id: 'rejected', name: 'Afgewezen', color: 'bg-red-500' },
];

export function CandidatesPage() {
  const { candidates, moveCandidate, addCandidate, updateCandidate, deleteCandidate, ensureVvcTagsOnAllCandidates } = useRecruitmentStore();
  const { contacts, addActivity, addContact, addTagToContact } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newCandidateTag, setNewCandidateTag] = useState('');
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [interviewData, setInterviewData] = useState({
    title: 'Sollicitatiegesprek',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    type: 'meeting',
    notes: 'Kennismakingsgesprek voor salesrol',
  });

  const [newCandidate, setNewCandidate] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    skills: [] as string[],
    experience_years: 0,
    expected_salary: 0,
    location: '',
    source: 'Manual',
  });

  const accessibleCandidates = useMemo(
    () => filterRecordsForUser(user, candidates, adminCompanyFilter),
    [user, candidates, adminCompanyFilter]
  );

  const filteredCandidates = useMemo(() => {
    return smartSearchCandidates(accessibleCandidates, searchQuery);
  }, [accessibleCandidates, searchQuery]);

  const vvcTaggedCandidatesCount = useMemo(
    () => accessibleCandidates.filter((c) => Boolean(getVvcTag(c))).length,
    [accessibleCandidates]
  );

  const handleSyncCandidateVvcTags = () => {
    const updated = ensureVvcTagsOnAllCandidates();
    if (updated > 0) {
      toast.success(`${updated} kandidaat-aanmelding(en) voorzien van unieke VVC API tag!`);
    } else {
      toast.info('Alle kandidaten hebben al een unieke VVC API tag.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

  const handleMoveCandidate = (candidateId: string, direction: 'next' | 'prev') => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const currentStageIndex = stages.findIndex((s) => s.id === candidate.status);
    const newStageIndex = direction === 'next' 
      ? Math.min(currentStageIndex + 1, stages.length - 1)
      : Math.max(currentStageIndex - 1, 0);
    
    const newStage = stages[newStageIndex].id as Candidate['status'];
    moveCandidate(candidateId, newStage);
    toast.success(`Verplaatst naar ${stages[newStageIndex].name}`);
  };

  const handleAddCandidate = () => {
    if (!newCandidate.first_name.trim() || !newCandidate.last_name.trim()) {
      toast.error('Vul voor- en achternaam in');
      return;
    }
    const created = addCandidate({
      ...newCandidate,
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
      status: 'new',
    });
    setIsAddDialogOpen(false);
    setNewCandidate({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      skills: [],
      experience_years: 0,
      expected_salary: 0,
      location: '',
      source: 'Manual',
    });
    toast.success(`Kandidaat aangemeld! Unieke VVC API Tag: ${created.vvc_tag || getVvcTag(created)}`);
  };

  // Recruitment to Revenue: Convert candidate to active sales agent / team contact
  const handlePromoteToSales = (candidate: Candidate) => {
    moveCandidate(candidate.id, 'hired');
    addContact({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      company: userCompanyName,
      title: 'Sales Agent (Nieuw Aangesteld)',
      status: 'internal',
      contact_type: 'internal',
      source: 'Recruitment Funnel',
      tags: ['Sales Agent', 'Interne Medewerker', 'Recruited', ...(candidate.skills || [])],
      custom_fields: { candidate_id: candidate.id, experience_years: candidate.experience_years },
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
    });
    setViewingCandidate(null);
    toast.success(
      `🎉 ${candidate.first_name} ${candidate.last_name} aangenomen en direct opgenomen in de CRMos salespool als interne agent!`
    );
  };

  const handleConfirmScheduleInterview = () => {
    if (!interviewCandidate) return;
    addActivity({
      type: 'meeting',
      title: `${interviewData.title}: ${interviewCandidate.first_name} ${interviewCandidate.last_name}`,
      description: interviewData.notes,
      due_date: interviewData.date,
      status: 'pending',
      assigned_to: user?.id || 'admin',
      related_to: { type: 'contact', id: interviewCandidate.id },
      company_name: userCompanyName,
      org_id: organization?.id || 'default_org',
    });
    moveCandidate(interviewCandidate.id, 'interview');
    setInterviewCandidate(null);
    toast.success(`Interview ingepland voor ${interviewCandidate.first_name} op ${interviewData.date}`);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Kandidaat',
      cell: ({ row }: { row: { original: Candidate } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback>
              {row.original.first_name[0]}{row.original.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {row.original.first_name} {row.original.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Fase',
      cell: ({ row }: { row: { original: Candidate } }) => {
        const stage = stages.find((s) => s.id === row.original.status);
        return (
          <Badge className={stage?.color.replace('bg-', 'bg-opacity-20 text-') || ''}>
            {stage?.name || row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'vvc_tag',
      header: 'VVC API Tag',
      cell: ({ row }: { row: { original: Candidate } }) => {
        const vvcTag = getVvcTag(row.original);
        if (!vvcTag) {
          return <span className="text-[11px] text-muted-foreground italic">Niet gekoppeld</span>;
        }
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(vvcTag);
              toast.success(`VVC kandidaat-tag gekopieerd: ${vvcTag}`);
            }}
            title="Klik om unieke VVC API tag te kopiëren"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer group"
          >
            <Tag className="h-3 w-3 shrink-0 text-amber-500" />
            <span>{vvcTag}</span>
            <Copy className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      },
    },
    {
      accessorKey: 'skills',
      header: 'Vaardigheden',
      cell: ({ row }: { row: { original: Candidate } }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.skills?.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
          ))}
          {row.original.skills && row.original.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{row.original.skills.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'experience',
      header: 'Ervaring',
      cell: ({ row }: { row: { original: Candidate } }) => (
        <span className="text-xs font-medium">{row.original.experience_years} jaar</span>
      ),
    },
    {
      accessorKey: 'expected_salary',
      header: 'Salarisindicatie',
      cell: ({ row }: { row: { original: Candidate } }) => (
        row.original.expected_salary ? (
          <span className="text-xs font-semibold text-foreground">
            €{row.original.expected_salary.toLocaleString('nl-NL')}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'source',
      header: 'Bron',
      cell: ({ row }: { row: { original: Candidate } }) => (
        <Badge variant="outline" className="text-xs">{row.original.source}</Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Candidate } }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleMoveCandidate(row.original.id, 'prev')}
            disabled={row.original.status === 'new'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleMoveCandidate(row.original.id, 'next')}
            disabled={row.original.status === 'rejected'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => setViewingCandidate(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Profiel inzien</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setInterviewCandidate(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Interview inplannen</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`mailto:${row.original.email}`)}
                className="gap-2 cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Email versturen</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePromoteToSales(row.original)}
                className="gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Aannemen & Promoveren</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  moveCandidate(row.original.id, 'rejected');
                  toast.info('Kandidaat status gezet op afgewezen');
                }}
                className="gap-2 text-amber-600 focus:text-amber-600 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Afwijzen</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  deleteCandidate(row.original.id);
                  toast.success('Kandidaat verwijderd');
                }}
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
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">Manage your recruitment pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={newCandidate.first_name}
                      onChange={(e) => setNewCandidate({ ...newCandidate, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={newCandidate.last_name}
                      onChange={(e) => setNewCandidate({ ...newCandidate, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={newCandidate.location}
                    onChange={(e) => setNewCandidate({ ...newCandidate, location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Experience (years)</Label>
                    <Input
                      type="number"
                      value={newCandidate.experience_years}
                      onChange={(e) => setNewCandidate({ ...newCandidate, experience_years: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Salary</Label>
                    <Input
                      type="number"
                      value={newCandidate.expected_salary}
                      onChange={(e) => setNewCandidate({ ...newCandidate, expected_salary: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Unieke VVC API tag wordt automatisch aangemaakt voor deze aanmelding</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-background border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono">
                    vvc-cand-auto
                  </Badge>
                </div>
                <Button onClick={handleAddCandidate}>Add Candidate</Button>
              </div>
          </DialogContent>
        </Dialog>
        </div>
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
                  ? `Admin Masterview (${accessibleCandidates.length} kandidaten)`
                  : isCorePartner
                  ? `CRMos Core Dataset (${accessibleCandidates.length} kandidaten)`
                  : `${userCompanyName} Workspace (${accessibleCandidates.length} kandidaten)`}
              </p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {isSuperAdmin
                  ? (adminCompanyFilter === 'all' ? 'Alle Bedrijven' : adminCompanyFilter)
                  : userCompanyName}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? 'Als administrator heb je overkoepelend toezicht en beheer over recruitment funnels van alle aangesloten organisaties.'
                : isCorePartner
                ? 'Deze kandidaatprofielen zijn gedeeld en exclusief toegankelijk voor CRMos, VVC, Quantum Initium, Logs Rent, Djobba en Trusting Work.'
                : `Strikte data-isolatie actief: Deze kandidaten zijn uitsluitend zichtbaar voor recruiters en medewerkers van ${userCompanyName}.`}
            </p>
          </div>
        </div>

        {/* VVC API Link Status for Candidate Registrations */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
            <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              VVC API Link: {vvcTaggedCandidatesCount}/{accessibleCandidates.length}
            </span>
          </div>
          {vvcTaggedCandidatesCount < accessibleCandidates.length && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCandidateVvcTags}
              className="h-8 rounded-xl text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Koppel Tags</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((stage) => (
          <Card key={stage.id} className="rounded-2xl border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <p className="text-xs text-muted-foreground">{stage.name}</p>
              </div>
              <p className="text-2xl font-bold">
                {accessibleCandidates.filter((c) => c.status === stage.id).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, email of vaardigheid..."
            className="pl-9 h-10 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {viewMode === 'list' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
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
          )}

          <div className="flex rounded-xl bg-muted/60 p-1 border border-border/50">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-7 text-xs rounded-lg px-3"
            >
              Pipeline Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 text-xs rounded-lg px-3"
            >
              Lijstweergave
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
            <DataTable
              columns={columns}
              data={paginatedCandidates}
              onRowClick={(row) => setViewingCandidate(row)}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
            <div>
              {filteredCandidates.length > 0 ? (
                <span>
                  Toont{' '}
                  <strong className="text-foreground">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  tot{' '}
                  <strong className="text-foreground">
                    {Math.min(currentPage * pageSize, filteredCandidates.length)}
                  </strong>{' '}
                  van <strong className="text-foreground">{filteredCandidates.length}</strong>{' '}
                  kandidaten
                </span>
              ) : (
                <span>0 kandidaten gevonden</span>
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
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.filter((s) => s.id !== 'rejected').map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => c.status === stage.id);
            return (
              <div key={stage.id} className="min-w-[280px] w-[280px]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    <span className="font-semibold text-sm">{stage.name}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{stageCandidates.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {stageCandidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      onClick={() => setViewingCandidate(candidate)}
                      className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all rounded-xl border-border/60"
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>
                              {candidate.first_name[0]}{candidate.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {candidate.first_name} {candidate.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                            {getVvcTag(candidate) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const t = getVvcTag(candidate)!;
                                  navigator.clipboard.writeText(t);
                                  toast.success(`VVC tag gekopieerd: ${t}`);
                                }}
                                title="Kopieer VVC API tag"
                                className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                              >
                                <Tag className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                <span className="truncate max-w-[140px]">{getVvcTag(candidate)}</span>
                              </button>
                            )}
                            {candidate.skills && candidate.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 2).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            {candidate.expected_salary ? `€${candidate.expected_salary.toLocaleString('nl-NL')}` : ''}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                              onClick={() => handleMoveCandidate(candidate.id, 'prev')}
                              disabled={stage.id === 'new'}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                              onClick={() => handleMoveCandidate(candidate.id, 'next')}
                              disabled={stage.id === 'hired'}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Modal */}
      <Dialog open={!!viewingCandidate} onOpenChange={(open) => !open && setViewingCandidate(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={viewingCandidate?.avatar} />
                <AvatarFallback>
                  {viewingCandidate?.first_name?.[0]}
                  {viewingCandidate?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold">
                  {viewingCandidate?.first_name} {viewingCandidate?.last_name}
                </p>
                <p className="text-xs text-muted-foreground font-normal">{viewingCandidate?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingCandidate && (
            <div className="space-y-4 py-2 text-sm">
              {/* VVC API Communicatie Tag voor Kandidaat Aanmelding & CRM Contact Koppeling */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 block">
                        Unieke VVC API Tag (Profiel &amp; CRM Contact)
                      </span>
                      <span className="font-mono text-xs font-semibold text-foreground truncate block">
                        {getVvcTag(viewingCandidate) || `vvc-cand-${viewingCandidate.id}`}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const tag = getVvcTag(viewingCandidate) || `vvc-cand-${viewingCandidate.id}`;
                      navigator.clipboard.writeText(tag);
                      toast.success(`VVC API tag gekopieerd: ${tag}`);
                    }}
                    className="h-7 text-xs px-2.5 gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Kopieer Tag</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ✓ Aanmeldgegevens zijn automatisch opgeslagen als Contact in het CRM met deze tag standaard gekoppeld.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Status / Fase</span>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold"
                    value={viewingCandidate.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Candidate['status'];
                      moveCandidate(viewingCandidate.id, newStatus);
                      setViewingCandidate({ ...viewingCandidate, status: newStatus });
                      toast.success(`Fase gewijzigd naar ${newStatus}`);
                    }}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Salarisindicatie</span>
                  <p className="font-semibold text-xs text-emerald-600">
                    {viewingCandidate.expected_salary
                      ? `€${viewingCandidate.expected_salary.toLocaleString('nl-NL')} per jaar`
                      : 'Niet gespecificeerd'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Ervaring</span>
                  <p className="font-semibold text-xs">{viewingCandidate.experience_years} jaar</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Locatie</span>
                  <p className="font-semibold text-xs">{viewingCandidate.location || 'Nederland'}</p>
                </div>
              </div>

              {viewingCandidate.skills && viewingCandidate.skills.length > 0 && (
                <div className="p-3 rounded-xl border border-border/50 bg-card space-y-1.5">
                  <span className="text-[11px] text-muted-foreground block">Vaardigheden & Competenties</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingCandidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Volledige Tags & Zelf Tags Toevoegen + Gekoppeld CRM Contact */}
              {(() => {
                const candTag = getVvcTag(viewingCandidate) || `vvc-cand-${viewingCandidate.id}`;
                const linkedContact = contacts.find(
                  (c) =>
                    c.id === `contact_cand_${viewingCandidate.id}` ||
                    c.vvc_tag === candTag ||
                    (viewingCandidate.email &&
                      c.email?.toLowerCase() === viewingCandidate.email.toLowerCase())
                );
                const allTags = Array.from(
                  new Set([
                    candTag,
                    ...(viewingCandidate.tags || []),
                    ...(viewingCandidate.skills || []),
                    ...(linkedContact?.tags || []),
                    ...(linkedContact?.company_tags || []),
                  ])
                ).filter(Boolean);

                return (
                  <div className="p-3.5 rounded-xl border border-primary/25 bg-primary/[0.03] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary block">
                          Alle Tags &amp; Team Indeling
                        </span>
                        <p className="text-xs font-medium text-foreground">
                          {linkedContact
                            ? `${linkedContact.team_name || 'Team Jamal Drenthe'} (${
                                (linkedContact.team_status || 'active') === 'active'
                                  ? 'Actief Team'
                                  : 'Passief Team'
                              }) • Via ${linkedContact.referred_by_name || 'Jamal Drenthe'}`
                            : 'Gekoppeld aan Referral Netwerk'}
                        </p>
                      </div>
                      {linkedContact && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingCandidate(null);
                            setSelectedContactId(linkedContact.id);
                          }}
                          className="h-7 rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          360° Contact &amp; Team
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {allTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] bg-background">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <Input
                        value={newCandidateTag}
                        onChange={(e) => setNewCandidateTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCandidateTag.trim()) {
                            e.preventDefault();
                            const t = newCandidateTag.trim();
                            const nextTags = Array.from(new Set([...(viewingCandidate.tags || []), t]));
                            updateCandidate(viewingCandidate.id, { tags: nextTags });
                            setViewingCandidate({ ...viewingCandidate, tags: nextTags });
                            if (linkedContact) {
                              addTagToContact(linkedContact.id, t);
                            }
                            setNewCandidateTag('');
                            toast.success(`Tag "${t}" toegevoegd`);
                          }
                        }}
                        placeholder="Voeg zelf een tag toe (bijv. Closer, #vvc, Actief Team)..."
                        className="h-8 text-xs rounded-xl bg-background"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newCandidateTag.trim()) return;
                          const t = newCandidateTag.trim();
                          const nextTags = Array.from(new Set([...(viewingCandidate.tags || []), t]));
                          updateCandidate(viewingCandidate.id, { tags: nextTags });
                          setViewingCandidate({ ...viewingCandidate, tags: nextTags });
                          if (linkedContact) {
                            addTagToContact(linkedContact.id, t);
                          }
                          setNewCandidateTag('');
                          toast.success(`Tag "${t}" toegevoegd`);
                        }}
                        className="h-8 text-xs rounded-xl gap-1 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tag</span>
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Direct Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {viewingCandidate.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 text-xs text-emerald-600 border-emerald-500/30"
                    onClick={() => window.open(`tel:${viewingCandidate.phone}`)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Bellen ({viewingCandidate.phone})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => window.open(`mailto:${viewingCandidate.email}`)}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email sturen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => {
                    const c = viewingCandidate;
                    setViewingCandidate(null);
                    setInterviewCandidate(c);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Interview plannen
                </Button>
              </div>

              {/* Recruitment to Revenue Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    Recruitment to Revenue (Conversie)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Neem deze kandidaat aan en converteer direct naar een actieve sales agent binnen CRMos.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  onClick={() => handlePromoteToSales(viewingCandidate)}
                >
                  Aannemen
                </Button>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => {
                    deleteCandidate(viewingCandidate.id);
                    setViewingCandidate(null);
                    toast.success('Kandidaat verwijderd');
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Verwijderen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setViewingCandidate(null)}
                >
                  Sluiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Modal */}
      <Dialog open={!!interviewCandidate} onOpenChange={(open) => !open && setInterviewCandidate(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Interview Plannen</span>
            </DialogTitle>
          </DialogHeader>
          {interviewCandidate && (
            <div className="space-y-3.5 py-3">
              <p className="text-xs text-muted-foreground">
                Plan een sollicitatiegesprek in met{' '}
                <strong className="text-foreground">
                  {interviewCandidate.first_name} {interviewCandidate.last_name}
                </strong>
                . Dit gesprek wordt automatisch vastgelegd in je CRMos agenda en activiteiten.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Titel van afspraak</Label>
                <Input
                  value={interviewData.title}
                  onChange={(e) => setInterviewData({ ...interviewData, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Datum van gesprek</Label>
                <Input
                  type="date"
                  value={interviewData.date}
                  onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notities / Agenda</Label>
                <Input
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  className="rounded-xl"
                  placeholder="Bijv. Eerste screening sales vaardigheden"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button variant="outline" className="rounded-full" onClick={() => setInterviewCandidate(null)}>
                  Annuleren
                </Button>
                <Button className="rounded-full" onClick={handleConfirmScheduleInterview}>
                  Interview Bevestigen
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
