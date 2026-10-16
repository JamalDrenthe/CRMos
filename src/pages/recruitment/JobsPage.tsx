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
  Filter,
  MoreHorizontal,
  MapPin,
  Users,
  DollarSign,
  Play,
  X,
  Layers,
  ShieldCheck,
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

export function JobsPage() {
  const { jobs, addJob, publishJob, closeJob } = useRecruitmentStore();
  const { user, adminCompanyFilter } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  const filteredJobs = accessibleJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddJob = () => {
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

  const columns = [
    {
      accessorKey: 'title',
      header: 'Position',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-sm text-muted-foreground">{row.original.department}</p>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.location}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'candidates',
      header: 'Candidates',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.candidates_count}</span>
        </div>
      ),
    },
    {
      accessorKey: 'salary',
      header: 'Salary Range',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        row.original.salary_min && row.original.salary_max ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              ${row.original.salary_min.toLocaleString()} - ${row.original.salary_max.toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <Badge
          variant={
            row.original.status === 'published'
              ? 'default'
              : row.original.status === 'draft'
              ? 'secondary'
              : 'outline'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof jobs[0] } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            {row.original.status === 'draft' && (
              <DropdownMenuItem onClick={() => { publishJob(row.original.id); toast.success('Job published'); }}>
                <Play className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            )}
            {row.original.status === 'published' && (
              <DropdownMenuItem onClick={() => { closeJob(row.original.id); toast.success('Job closed'); }}>
                <X className="mr-2 h-4 w-4" />
                Close
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
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

      <DataTable columns={columns} data={filteredJobs} />
    </div>
  );
}
