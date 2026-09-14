import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as const,
    description: '',
    requirements: [] as string[],
    salary_min: 0,
    salary_max: 0,
  });

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddJob = () => {
    addJob({
      ...newJob,
      currency: 'USD',
      status: 'draft',
      hiring_manager: 'user1',
      assigned_recruiters: ['user1'],
      candidates_count: 0,
    });
    setIsAddDialogOpen(false);
    setNewJob({
      title: '',
      department: '',
      location: '',
      type: 'full-time',
      description: '',
      requirements: [],
      salary_min: 0,
      salary_max: 0,
    });
    toast.success('Job created successfully');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage open positions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value as any })}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Salary</Label>
                  <Input
                    type="number"
                    value={newJob.salary_min}
                    onChange={(e) => setNewJob({ ...newJob, salary_min: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Salary</Label>
                  <Input
                    type="number"
                    value={newJob.salary_max}
                    onChange={(e) => setNewJob({ ...newJob, salary_max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleAddJob}>Create Job</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-bold">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-green-500">
              {jobs.filter((j) => j.status === 'published').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold">
              {jobs.filter((j) => j.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Candidates</p>
            <p className="text-2xl font-bold">
              {jobs.reduce((sum, j) => sum + j.candidates_count, 0)}
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
