import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/common/DataTable';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
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

const stages = [
  { id: 'new', name: 'New', color: 'bg-gray-500' },
  { id: 'screening', name: 'Screening', color: 'bg-blue-500' },
  { id: 'interview', name: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', name: 'Offer', color: 'bg-orange-500' },
  { id: 'hired', name: 'Hired', color: 'bg-green-500' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-500' },
];

export function CandidatesPage() {
  const { candidates, moveCandidate, addCandidate } = useRecruitmentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMoveCandidate = (candidateId: string, direction: 'next' | 'prev') => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const currentStageIndex = stages.findIndex((s) => s.id === candidate.status);
    const newStageIndex = direction === 'next' 
      ? Math.min(currentStageIndex + 1, stages.length - 1)
      : Math.max(currentStageIndex - 1, 0);
    
    const newStage = stages[newStageIndex].id as import('@/types').Candidate['status'];
    moveCandidate(candidateId, newStage);
    toast.success(`Moved to ${stages[newStageIndex].name}`);
  };

  const handleAddCandidate = () => {
    addCandidate({
      ...newCandidate,
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
    toast.success('Candidate added successfully');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Candidate',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback>
              {row.original.first_name[0]}{row.original.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => {
        const stage = stages.find((s) => s.id === row.original.status);
        return (
          <Badge className={stage?.color.replace('bg-', 'bg-opacity-20 text-') || ''}>
            {stage?.name}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'skills',
      header: 'Skills',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
          ))}
          {row.original.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{row.original.skills.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'experience',
      header: 'Experience',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        <span>{row.original.experience_years} years</span>
      ),
    },
    {
      accessorKey: 'expected_salary',
      header: 'Expected Salary',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        row.original.expected_salary ? (
          <span>${row.original.expected_salary.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        <Badge variant="outline">{row.original.source}</Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof candidates[0] } }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveCandidate(row.original.id, 'prev')}
            disabled={row.original.status === 'new'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveCandidate(row.original.id, 'next')}
            disabled={row.original.status === 'rejected'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
              <DropdownMenuItem>Send Email</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Reject</DropdownMenuItem>
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
                <Button onClick={handleAddCandidate}>Add Candidate</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <p className="text-sm text-muted-foreground">{stage.name}</p>
              </div>
              <p className="text-2xl font-bold">
                {candidates.filter((c) => c.status === stage.id).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
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

      {viewMode === 'list' ? (
        <DataTable columns={columns} data={filteredCandidates} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.filter((s) => s.id !== 'rejected').map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => c.status === stage.id);
            return (
              <div key={stage.id} className="min-w-[280px] w-[280px]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.name}</span>
                    <Badge variant="secondary">{stageCandidates.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map((candidate) => (
                    <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>
                              {candidate.first_name[0]}{candidate.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {candidate.first_name} {candidate.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-[10px]">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveCandidate(candidate.id, 'prev')}
                            disabled={stage.id === 'new'}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveCandidate(candidate.id, 'next')}
                            disabled={stage.id === 'hired'}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
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
    </div>
  );
}
