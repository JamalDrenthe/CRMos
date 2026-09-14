import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import {
  Plus,
  Search,
  MoreHorizontal,
  MessageSquare,
  Play,
  Edit,
  Copy,
  Trash2,
  ChevronRight,
  GitBranch,
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

export function PitchFlowsPage() {
  const { pitchFlows, addPitchFlow } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPitchFlow, setNewPitchFlow] = useState({
    name: '',
    description: '',
  });

  const filteredPitchFlows = pitchFlows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPitchFlow = () => {
    addPitchFlow({
      ...newPitchFlow,
      steps: [
        { id: '1', order: 0, type: 'intro', title: 'Introduction', content: 'Hi, this is [Agent] from JamCRM.' },
      ],
      is_active: true,
    });
    setIsAddDialogOpen(false);
    setNewPitchFlow({ name: '', description: '' });
    toast.success('Pitch flow created');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Pitch Flow',
      cell: ({ row }: { row: { original: typeof pitchFlows[0] } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'steps',
      header: 'Steps',
      cell: ({ row }: { row: { original: typeof pitchFlows[0] } }) => (
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.steps.length} steps</span>
        </div>
      ),
    },
    {
      accessorKey: 'branching',
      header: 'Branching',
      cell: ({ row }: { row: { original: typeof pitchFlows[0] } }) => {
        const hasBranching = row.original.steps.some((s) => s.branching && s.branching.length > 0);
        return hasBranching ? (
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-500" />
            <span>Yes</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof pitchFlows[0] } }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Play className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
          <h1 className="text-3xl font-bold">Pitch Flows</h1>
          <p className="text-muted-foreground">Create and manage sales scripts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Pitch Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Pitch Flow</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newPitchFlow.name}
                  onChange={(e) => setNewPitchFlow({ ...newPitchFlow, name: e.target.value })}
                  placeholder="e.g., Enterprise Software Pitch"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newPitchFlow.description}
                  onChange={(e) => setNewPitchFlow({ ...newPitchFlow, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
              <Button onClick={handleAddPitchFlow}>Create Pitch Flow</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Flows</p>
            <p className="text-2xl font-bold">{pitchFlows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {pitchFlows.filter((f) => f.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">With Branching</p>
            <p className="text-2xl font-bold text-purple-500">
              {pitchFlows.filter((f) => f.steps.some((s) => s.branching?.length)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Steps</p>
            <p className="text-2xl font-bold">
              {Math.round(pitchFlows.reduce((sum, f) => sum + f.steps.length, 0) / pitchFlows.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pitch flows..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredPitchFlows} />
    </div>
  );
}
