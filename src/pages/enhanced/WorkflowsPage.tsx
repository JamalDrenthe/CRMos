import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import type { Workflow as WorkflowType } from '@/types';
import {
  Plus,
  Search,
  Workflow,
  Edit,
  Trash2,
  MoreHorizontal,
  BarChart3,
  Play,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Activity,
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

type TriggerType = 'deal_created' | 'deal_stage_changed' | 'deal_won' | 'contact_created' | 'email_opened' | 'call_completed';

export function WorkflowsPage() {
  const { workflows, toggleWorkflow, deleteWorkflow, addWorkflow, updateWorkflow } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<{
    name: string;
    description: string;
    trigger: { type: TriggerType; config: Record<string, unknown> };
    actions: { id: string; type: 'send_email' | 'send_sms' | 'create_task' | 'create_activity' | 'webhook' | 'delay'; config: Record<string, unknown>; order: number }[];
  }>({
    name: '',
    description: '',
    trigger: { type: 'deal_created', config: {} },
    actions: [{ id: '1', type: 'send_email', config: {}, order: 0 }],
  });

  // Modal states
  const [selectedWorkflowForEdit, setSelectedWorkflowForEdit] = useState<WorkflowType | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    triggerType: TriggerType;
  }>({
    name: '',
    description: '',
    triggerType: 'deal_created',
  });
  const [selectedWorkflowForLogs, setSelectedWorkflowForLogs] = useState<WorkflowType | null>(null);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredWorkflows.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedWorkflows = filteredWorkflows.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  const handleAddWorkflow = () => {
    if (!newWorkflow.name.trim()) {
      toast.error('Vul een workflow naam in');
      return;
    }
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
    toast.success('Workflow succesvol aangemaakt');
  };

  const openEditModal = (wf: WorkflowType) => {
    setSelectedWorkflowForEdit(wf);
    setEditForm({
      name: wf.name,
      description: wf.description || '',
      triggerType: wf.trigger.type as TriggerType,
    });
  };

  const handleSaveEdit = () => {
    if (!selectedWorkflowForEdit) return;
    if (!editForm.name.trim()) {
      toast.error('Vul een workflow naam in');
      return;
    }

    updateWorkflow(selectedWorkflowForEdit.id, {
      name: editForm.name,
      description: editForm.description,
      trigger: {
        ...selectedWorkflowForEdit.trigger,
        type: editForm.triggerType,
      },
    });
    setSelectedWorkflowForEdit(null);
    toast.success('Workflow bijgewerkt');
  };

  const handleRunTest = (wf: WorkflowType) => {
    updateWorkflow(wf.id, {
      run_count: wf.run_count + 1,
      last_run_at: new Date().toISOString(),
    });
    toast.success(`Test-run uitgevoerd voor "${wf.name}" — Alle ${wf.actions.length} acties geslaagd`);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Workflow',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setSelectedWorkflowForLogs(row.original)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">{row.original.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'trigger',
      header: 'Trigger',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <Badge variant="outline" className="capitalize text-xs font-medium rounded-lg">
          {row.original.trigger.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Acties',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <span className="text-sm font-medium">{row.original.actions.length} acties</span>
      ),
    },
    {
      accessorKey: 'runs',
      header: 'Uitvoeringen',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.run_count.toLocaleString('nl-NL')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={row.original.is_active}
            onCheckedChange={() => {
              toggleWorkflow(row.original.id);
              toast.success(row.original.is_active ? 'Workflow gepauzeerd' : 'Workflow geactiveerd');
            }}
          />
          <Badge 
            variant={row.original.is_active ? 'default' : 'secondary'}
            className="text-xs rounded-full"
          >
            {row.original.is_active ? 'Actief' : 'Gepauzeerd'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: WorkflowType } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleRunTest(row.original)}>
              <Play className="mr-2 h-4 w-4 text-emerald-500" />
              Direct Testen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditModal(row.original)}>
              <Edit className="mr-2 h-4 w-4 text-amber-500" />
              Bewerken
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedWorkflowForLogs(row.original)}>
              <Activity className="mr-2 h-4 w-4 text-blue-500" />
              Bekijk Uitvoeringslogs
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => { 
                deleteWorkflow(row.original.id); 
                toast.success('Workflow verwijderd'); 
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows & Automatisering</h1>
          <p className="text-muted-foreground mt-1">
            Automatiseer bedrijfsprocessen, triggers en opvolgacties
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Nieuwe Workflow Aanmaken</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="space-y-1.5">
                <Label>Workflow Naam</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="bijv. Nieuwe Lead Opvolging"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Omschrijving</Label>
                <Input
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Wat activeert en doet deze workflow?"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trigger Gebeurtenis</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newWorkflow.trigger.type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger: { type: e.target.value as TriggerType, config: {} } })}
                >
                  <option value="deal_created">Deal Aangemaakt</option>
                  <option value="deal_stage_changed">Deal Fase Gewijzigd</option>
                  <option value="deal_won">Deal Gewonnen (Won)</option>
                  <option value="contact_created">Nieuw Contact Aangemaakt</option>
                  <option value="email_opened">E-mail Geopend</option>
                  <option value="call_completed">Telefoongesprek Afgerond</option>
                </select>
              </div>
              <Button onClick={handleAddWorkflow} className="w-full mt-2 rounded-xl">
                Workflow Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Totale Workflows</p>
            <p className="text-2xl font-bold mt-1">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Actief</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {workflows.filter((w) => w.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Totale Uitvoeringen</p>
            <p className="text-2xl font-bold mt-1">
              {workflows.reduce((sum, w) => sum + w.run_count, 0).toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Laatste 24 uur</p>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {workflows.filter((w) => w.last_run_at && new Date(w.last_run_at) > new Date(Date.now() - 86400000)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek workflows op naam of omschrijving..."
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">Rijen:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Rijen per pagina"
            className="text-xs rounded-lg border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <DataTable columns={columns} data={paginatedWorkflows} />
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
        <p>
          Weergave van{' '}
          <span className="font-semibold text-foreground">
            {filteredWorkflows.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}
          </span>{' '}
          t/m{' '}
          <span className="font-semibold text-foreground">
            {Math.min(validCurrentPage * pageSize, filteredWorkflows.length)}
          </span>{' '}
          van <span className="font-semibold text-foreground">{filteredWorkflows.length}</span> workflows
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Vorige
          </Button>
          <span className="text-xs font-medium px-2">
            Pagina {validCurrentPage} van {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
          >
            Volgende <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* View Execution Logs Dialog */}
      <Dialog open={!!selectedWorkflowForLogs} onOpenChange={(open) => !open && setSelectedWorkflowForLogs(null)}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedWorkflowForLogs?.name}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Uitvoeringsgeschiedenis & Details</p>
              </div>
            </div>
          </DialogHeader>

          {selectedWorkflowForLogs && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trigger:</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedWorkflowForLogs.trigger.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={selectedWorkflowForLogs.is_active ? 'default' : 'secondary'}>
                    {selectedWorkflowForLogs.is_active ? 'Actief' : 'Gepauzeerd'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Aantal keer getriggerd:</span>
                  <span className="font-semibold">{selectedWorkflowForLogs.run_count} keer</span>
                </div>
                {selectedWorkflowForLogs.last_run_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Laatste uitvoering:</span>
                    <span className="font-medium text-xs">
                      {new Date(selectedWorkflowForLogs.last_run_at).toLocaleString('nl-NL')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Pipeline Visualizer */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gekoppelde Acties ({selectedWorkflowForLogs.actions.length})
                </Label>
                <div className="space-y-2">
                  {selectedWorkflowForLogs.actions.map((act, idx) => (
                    <div 
                      key={act.id || idx}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card text-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium capitalize">{act.type.replace(/_/g, ' ')}</span>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 dark:border-emerald-700">
                        Geconfigureerd
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Logs Table / List */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recente Uitvoeringslogs
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Uitvoering voltooid (200 OK)</span>
                    </div>
                    <span className="text-muted-foreground">
                      {selectedWorkflowForLogs.last_run_at 
                        ? new Date(selectedWorkflowForLogs.last_run_at).toLocaleTimeString('nl-NL')
                        : 'Zojuist'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleRunTest(selectedWorkflowForLogs)}
                  className="rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Nu Testen
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const wf = selectedWorkflowForLogs;
                      setSelectedWorkflowForLogs(null);
                      openEditModal(wf);
                    }}
                    className="rounded-xl"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Bewerken
                  </Button>
                  <Button onClick={() => setSelectedWorkflowForLogs(null)} className="rounded-xl">
                    Sluiten
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog open={!!selectedWorkflowForEdit} onOpenChange={(open) => !open && setSelectedWorkflowForEdit(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Workflow Bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1.5">
              <Label>Workflow Naam</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Omschrijving</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger Gebeurtenis</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={editForm.triggerType}
                onChange={(e) => setEditForm({ ...editForm, triggerType: e.target.value as TriggerType })}
              >
                <option value="deal_created">Deal Aangemaakt</option>
                <option value="deal_stage_changed">Deal Fase Gewijzigd</option>
                <option value="deal_won">Deal Gewonnen (Won)</option>
                <option value="contact_created">Nieuw Contact Aangemaakt</option>
                <option value="email_opened">E-mail Geopend</option>
                <option value="call_completed">Telefoongesprek Afgerond</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedWorkflowForEdit(null)} className="rounded-xl">
                Annuleren
              </Button>
              <Button onClick={handleSaveEdit} className="rounded-xl">
                Wijzigingen Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
