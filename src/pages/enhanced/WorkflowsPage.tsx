import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import {
  Plus,
  Search,
  Workflow,
  Edit,
  Trash2,
  MoreHorizontal,
  BarChart3,
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

export function WorkflowsPage() {
  const { workflows, toggleWorkflow, deleteWorkflow, addWorkflow } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<{
    name: string;
    description: string;
    trigger: { type: 'deal_created' | 'deal_stage_changed' | 'deal_won' | 'contact_created' | 'email_opened' | 'call_completed'; config: Record<string, unknown> };
    actions: { id: string; type: 'send_email' | 'send_sms' | 'create_task' | 'create_activity' | 'webhook' | 'delay'; config: Record<string, unknown>; order: number }[];
  }>({
    name: '',
    description: '',
    trigger: { type: 'deal_created', config: {} },
    actions: [{ id: '1', type: 'send_email', config: {}, order: 0 }],
  });

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWorkflow = () => {
    addWorkflow({
      ...newWorkflow,
      is_active: true,
      created_by: 'user1',
    });
    setIsAddDialogOpen(false);
    setNewWorkflow({
      name: '',
      description: '',
      trigger: { type: 'deal_created', config: {} },
      actions: [{ id: '1', type: 'send_email', config: {}, order: 0 }],
    });
    toast.success('Workflow created');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Workflow',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'trigger',
      header: 'Trigger',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.trigger.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
        <span>{row.original.actions.length} actions</span>
      ),
    },
    {
      accessorKey: 'runs',
      header: 'Runs',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.run_count.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.is_active}
            onCheckedChange={() => {
              toggleWorkflow(row.original.id);
              toast.success(row.original.is_active ? 'Workflow paused' : 'Workflow activated');
            }}
          />
          <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
            {row.original.is_active ? 'Active' : 'Paused'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof workflows[0] } }) => (
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
              <BarChart3 className="mr-2 h-4 w-4" />
              View Logs
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => { deleteWorkflow(row.original.id); toast.success('Workflow deleted'); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automate your business processes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="e.g., New Lead Follow-up"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="What does this workflow do?"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newWorkflow.trigger.type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger: { type: e.target.value as typeof newWorkflow.trigger.type, config: {} } })}
                >
                  <option value="deal_created">Deal Created</option>
                  <option value="deal_stage_changed">Deal Stage Changed</option>
                  <option value="deal_won">Deal Won</option>
                  <option value="contact_created">Contact Created</option>
                  <option value="email_opened">Email Opened</option>
                  <option value="call_completed">Call Completed</option>
                </select>
              </div>
              <Button onClick={handleAddWorkflow}>Create Workflow</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Workflows</p>
            <p className="text-2xl font-bold">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {workflows.filter((w) => w.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.run_count, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last 24h</p>
            <p className="text-2xl font-bold text-blue-500">
              {workflows.filter((w) => w.last_run_at && new Date(w.last_run_at) > new Date(Date.now() - 86400000)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredWorkflows} />
    </div>
  );
}
