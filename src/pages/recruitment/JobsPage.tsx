import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser } from '@/lib/companyAccess';
import { isCoreEcosystemCompany, type Job } from '@/types';
import {
  Plus,
  Search,
  MoreHorizontal,
  MapPin,
  Users,
  Euro,
  Play,
  X,
  Layers,
  ShieldCheck,
  Edit3,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
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

export function JobsPage() {
  const { jobs, addJob, updateJob, deleteJob, publishJob, closeJob } = useRecruitmentStore();
  const { user, adminCompanyFilter } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as Job['type'],
    description: '',
    salary_min: 0,
    salary_max: 0,
  });

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as Job['type'],
    description: '',
    requirements: [] as string[],
    salary_min: 0,
    salary_max: 0,
  });

  const isCore = isCoreEcosystemCompany(user?.company_name);

  const accessibleJobs = useMemo(
    () => filterRecordsForUser(user, jobs, adminCompanyFilter),
    [user, jobs, adminCompanyFilter]
  );

  const filteredJobs = useMemo(() => {
    return accessibleJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [accessibleJobs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  const handleAddJob = () => {
    if (!newJob.title.trim()) {
      toast.error('Vul een functietitel in');
      return;
    }
    addJob({
      ...newJob,
      currency: 'EUR',
      status: 'draft',
      hiring_manager: user?.id || 'user1',
      assigned_recruiters: [user?.id || 'user1'],
      candidates_count: 0,
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });
    setIsAddDialogOpen(false);
    setNewJob({
      title: '',
      department: '',
      location: '',
      type: 'full-time' as Job['type'],
      description: '',
      requirements: [],
      salary_min: 0,
      salary_max: 0,
    });
    toast.success('Vacature succesvol aangemaakt');
  };

  const handleStartEdit = (job: Job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description || '',
      salary_min: job.salary_min || 0,
      salary_max: job.salary_max || 0,
    });
  };

  const handleSaveEdit = () => {
    if (!editingJob) return;
    updateJob(editingJob.id, {
      title: editFormData.title.trim() || editingJob.title,
      department: editFormData.department.trim() || editingJob.department,
      location: editFormData.location.trim() || editingJob.location,
      type: editFormData.type,
      description: editFormData.description,
      salary_min: Number(editFormData.salary_min) || undefined,
      salary_max: Number(editFormData.salary_max) || undefined,
    });
    setEditingJob(null);
    if (viewingJob?.id === editingJob.id) {
      setViewingJob((prev) =>
        prev
          ? {
              ...prev,
              title: editFormData.title.trim() || prev.title,
              department: editFormData.department.trim() || prev.department,
              location: editFormData.location.trim() || prev.location,
              type: editFormData.type,
              description: editFormData.description,
              salary_min: Number(editFormData.salary_min) || undefined,
              salary_max: Number(editFormData.salary_max) || undefined,
            }
          : null
      );
    }
    toast.success('Vacature succesvol bijgewerkt');
  };

  const columns = [
    {
      accessorKey: 'title',
      header: 'Functie',
      cell: ({ row }: { row: { original: Job } }) => (
        <div>
          <p className="font-semibold text-sm text-foreground">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.department}</p>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Locatie',
      cell: ({ row }: { row: { original: Job } }) => (
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{row.original.location}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Dienstverband',
      cell: ({ row }: { row: { original: Job } }) => (
        <Badge variant="outline" className="text-xs capitalize">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'candidates',
      header: 'Kandidaten',
      cell: ({ row }: { row: { original: Job } }) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">{row.original.candidates_count}</span>
        </div>
      ),
    },
    {
      accessorKey: 'salary',
      header: 'Salarisindicatie',
      cell: ({ row }: { row: { original: Job } }) => (
        row.original.salary_min && row.original.salary_max ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Euro className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              €{row.original.salary_min.toLocaleString('nl-NL')} - €{row.original.salary_max.toLocaleString('nl-NL')}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Job } }) => (
        <Badge
          variant={
            row.original.status === 'published'
              ? 'default'
              : row.original.status === 'draft'
              ? 'secondary'
              : 'outline'
          }
          className="text-xs capitalize font-semibold"
        >
          {row.original.status === 'published'
            ? 'Gepubliceerd'
            : row.original.status === 'draft'
            ? 'Concept'
            : row.original.status === 'closed'
            ? 'Gesloten'
            : row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Job } }) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setViewingJob(row.original)}
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
              {row.original.status === 'draft' && (
                <DropdownMenuItem
                  onClick={() => { publishJob(row.original.id); toast.success('Vacature gepubliceerd'); }}
                  className="gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Publiceren</span>
                </DropdownMenuItem>
              )}
              {row.original.status === 'published' && (
                <DropdownMenuItem
                  onClick={() => { closeJob(row.original.id); toast.success('Vacature gesloten'); }}
                  className="gap-2 text-amber-600 focus:text-amber-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Sluiten</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  deleteJob(row.original.id);
                  toast.success('Vacature verwijderd');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vacatures</h1>
            {isCore ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
                <Layers className="h-3 w-3" />
                Core Ecosysteem
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 text-xs gap-1">
                <ShieldCheck className="h-3 w-3" />
                {user?.company_name || 'Geïsoleerd'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Beheer openstaande functies en recruitmentpijplijnen voor jouw organisatie.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vacature Plaatsen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nieuwe Vacature Aanmaken</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Functietitel</Label>
                <Input
                  value={newJob.title}
                  placeholder="bijv. Commercieel Medewerker Buitendienst"
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Afdeling</Label>
                  <Input
                    value={newJob.department}
                    placeholder="bijv. Field Sales"
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Locatie</Label>
                  <Input
                    value={newJob.location}
                    placeholder="bijv. Amsterdam / Randstad"
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dienstverband</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value as Job['type'] })}
                >
                  <option value="full-time">Fulltime</option>
                  <option value="part-time">Parttime</option>
                  <option value="contract">Tijdelijk Contract</option>
                  <option value="internship">Stage / Werkstudent</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Salaris / Provisie (€)</Label>
                  <Input
                    type="number"
                    value={newJob.salary_min}
                    onChange={(e) => setNewJob({ ...newJob, salary_min: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Salaris / OTE (€)</Label>
                  <Input
                    type="number"
                    value={newJob.salary_max}
                    onChange={(e) => setNewJob({ ...newJob, salary_max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleAddJob}>Vacature Opslaan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totaal Vacatures</p>
            <p className="text-2xl font-bold">{accessibleJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gepubliceerd</p>
            <p className="text-2xl font-bold text-green-500">
              {accessibleJobs.filter((j) => j.status === 'published').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Concepten</p>
            <p className="text-2xl font-bold">
              {accessibleJobs.filter((j) => j.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totaal Sollicitanten</p>
            <p className="text-2xl font-bold">
              {accessibleJobs.reduce((sum, j) => sum + j.candidates_count, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek vacatures op titel, afdeling of locatie..."
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
          data={paginatedJobs}
          onRowClick={(row) => setViewingJob(row)}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          {filteredJobs.length > 0 ? (
            <span>
              Toont{' '}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              tot{' '}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredJobs.length)}
              </strong>{' '}
              van <strong className="text-foreground">{filteredJobs.length}</strong>{' '}
              vacatures
            </span>
          ) : (
            <span>0 vacatures gevonden</span>
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

      {/* View Job Details Modal */}
      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>{viewingJob?.title}</span>
              <Badge variant="secondary" className="capitalize text-xs font-semibold">
                {viewingJob?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {viewingJob && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Afdeling</span>
                  <p className="font-semibold text-xs">{viewingJob.department}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Locatie</span>
                  <p className="font-semibold text-xs flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {viewingJob.location}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Dienstverband</span>
                  <p className="font-semibold text-xs capitalize">{viewingJob.type}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Kandidaten</span>
                  <p className="font-semibold text-xs flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {viewingJob.candidates_count} gesolliciteerd
                  </p>
                </div>
              </div>

              {viewingJob.salary_min && viewingJob.salary_max && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Salarisindicatie / OTE</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    €{viewingJob.salary_min.toLocaleString('nl-NL')} - €{viewingJob.salary_max.toLocaleString('nl-NL')}
                  </span>
                </div>
              )}

              {viewingJob.description && (
                <div className="p-3 rounded-xl border border-border/50 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Functieomschrijving</span>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{viewingJob.description}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => {
                    deleteJob(viewingJob.id);
                    setViewingJob(null);
                    toast.success('Vacature verwijderd');
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Verwijderen
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewingJob(null)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const j = viewingJob;
                      setViewingJob(null);
                      handleStartEdit(j);
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

      {/* Edit Job Modal */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Vacature bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Functietitel</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Afdeling</Label>
                <Input
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Locatie</Label>
                <Input
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min. Salaris (€)</Label>
                <Input
                  type="number"
                  value={editFormData.salary_min}
                  onChange={(e) => setEditFormData({ ...editFormData, salary_min: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max. Salaris (€)</Label>
                <Input
                  type="number"
                  value={editFormData.salary_max}
                  onChange={(e) => setEditFormData({ ...editFormData, salary_max: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Omschrijving</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingJob(null)}>
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
