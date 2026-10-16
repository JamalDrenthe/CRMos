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
  const { pitchFlows, addPitchFlow, updatePitchFlow, deletePitchFlow } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<typeof pitchFlows[0] | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
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
        { id: '1', order: 0, type: 'intro', title: 'Introduction', content: 'Hi, this is [Agent] from CRMos.' },
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
      cell: ({ row }: { row: { original: typeof pitchFlows[0] } }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10"
            onClick={() => toast.success(`Pitch flow "${row.original.name}" geactiveerd voor telemarketeers`)}
            title="Activeren / Oefenen"
          >
            <Play className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  setEditingFlow(row.original);
                  setEditFormData({ name: row.original.name, description: row.original.description || '' });
                }}
                className="gap-2 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Bewerken</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  addPitchFlow({
                    name: `${row.original.name} (Kopie)`,
                    description: row.original.description,
                    steps: row.original.steps,
                    is_active: true,
                  });
                  toast.success('Pitch flow gedupliceerd');
                }}
                className="gap-2 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Dupliceren</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  deletePitchFlow(row.original.id);
                  toast.success('Pitch flow verwijderd');
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

      {/* Edit Pitch Flow Modal */}
      <Dialog open={!!editingFlow} onOpenChange={(open) => !open && setEditingFlow(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pitch flow bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Naam van belscript / flow</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Omschrijving / Doelstelling</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingFlow(null)}>
              Annuleren
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                if (editingFlow) {
                  updatePitchFlow(editingFlow.id, {
                    name: editFormData.name.trim() || editingFlow.name,
                    description: editFormData.description,
                  });
                  setEditingFlow(null);
                  toast.success('Pitch flow bijgewerkt');
                }
              }}
            >
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
