import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser, isCoreEcosystemCompany } from '@/lib/companyAccess';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Building2,
  Euro,
  ShieldCheck,
  Lock,
  Edit3,
  Eye,
  Trash2,
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

interface DealCardProps {
  deal: ReturnType<typeof useCRMStore.getState>['deals'][0];
  isOverlay?: boolean;
  onEdit?: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
  onViewDetails?: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
  onDelete?: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
}

function DealCard({ deal, isOverlay, onEdit, onViewDetails, onDelete }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { type: 'Deal', deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onViewDetails?.(deal)}
      className={`group rounded-xl border bg-card p-3 shadow-xs cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-md transition-all ${
        isOverlay ? 'shadow-xl rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {deal.name}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1 opacity-70 hover:opacity-100">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(deal);
              }}
              className="gap-2 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Details inzien</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(deal);
              }}
              className="gap-2 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Bewerken</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(deal);
              }}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Verwijderen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{deal.company_name || 'Geen bedrijf'}</span>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <Euro className="h-3.5 w-3.5 text-emerald-600" />
          {formatCurrency(deal.value)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {deal.expected_close_date
            ? new Date(deal.expected_close_date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })
            : '-'}
        </div>
      </div>
      
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Kans</span>
          <span>{deal.probability}%</span>
        </div>
        <Progress value={deal.probability} className="h-1.5" />
      </div>
      
      {deal.tags && deal.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface StageColumnProps {
  stage: ReturnType<typeof useCRMStore.getState>['pipelines'][0]['stages'][0];
  deals: ReturnType<typeof useCRMStore.getState>['deals'];
  onEdit: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
  onViewDetails: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
  onDelete: (deal: ReturnType<typeof useCRMStore.getState>['deals'][0]) => void;
}

function StageColumn({ stage, deals, onEdit, onViewDetails, onDelete }: StageColumnProps) {
  const stageDeals = deals.filter((d) => d.stage === stage.id);
  const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'Stage', stage },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-2xl bg-muted/40 border border-border/50 p-3.5 min-w-[280px] w-[280px]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shadow-xs"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-semibold text-sm">{stage.name}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {stageDeals.length}
          </Badge>
        </div>
      </div>
      
      <div className="mb-3 text-xs font-medium text-muted-foreground">
        {formatCurrency(totalValue)}
      </div>
      
      <ScrollArea className="flex-1 -mx-1 px-1">
        <SortableContext
          items={stageDeals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5 min-h-[100px]">
            {stageDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function DealsPage() {
  const { pipelines, deals, moveDeal, addDeal, updateDeal, deleteDeal } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDeal, setActiveDeal] = useState<typeof deals[0] | null>(null);
  const [viewingDeal, setViewingDeal] = useState<typeof deals[0] | null>(null);
  const [editingDeal, setEditingDeal] = useState<typeof deals[0] | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    value: 0,
    stage: '',
    probability: 50,
    expected_close_date: '',
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    company_id: '',
    value: 0,
    stage: 'lead',
    expected_close_date: '',
  });

  const defaultPipeline = pipelines[0];

  const handleStartEdit = (deal: typeof deals[0]) => {
    setEditingDeal(deal);
    setEditFormData({
      name: deal.name,
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingDeal) return;
    updateDeal(editingDeal.id, {
      name: editFormData.name.trim() || editingDeal.name,
      value: Number(editFormData.value) || 0,
      stage: editFormData.stage || editingDeal.stage,
      probability: Number(editFormData.probability) || 0,
      expected_close_date: editFormData.expected_close_date,
    });
    setEditingDeal(null);
    if (viewingDeal?.id === editingDeal.id) {
      setViewingDeal((prev) =>
        prev
          ? {
              ...prev,
              name: editFormData.name.trim() || prev.name,
              value: Number(editFormData.value) || 0,
              stage: editFormData.stage || prev.stage,
              probability: Number(editFormData.probability) || 0,
              expected_close_date: editFormData.expected_close_date,
            }
          : null
      );
    }
    toast.success('Deal succesvol bijgewerkt');
  };

  const handleDeleteDeal = (deal: typeof deals[0]) => {
    deleteDeal(deal.id);
    if (viewingDeal?.id === deal.id) {
      setViewingDeal(null);
    }
    toast.success(`Deal "${deal.name}" verwijderd`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find((d) => d.id === active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a stage
    const stage = defaultPipeline?.stages.find((s) => s.id === overId);
    if (stage) {
      moveDeal(dealId, stage.id);
      toast.success(`Deal moved to ${stage.name}`);
    }
  };

  const accessibleDeals = filterRecordsForUser(user, deals, adminCompanyFilter);

  const filteredDeals = accessibleDeals.filter(
    (deal) =>
      deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPipelineValue = accessibleDeals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = accessibleDeals.filter((d) => d.stage === 'closed-won' || d.stage === 'won').reduce((sum, d) => sum + d.value, 0);

  const handleAddDeal = () => {
    addDeal({
      ...newDeal,
      org_id: organization?.id || 'default_org',
      company_name: userCompanyName,
      allowed_companies: isCorePartner
        ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
        : [userCompanyName],
      currency: 'EUR',
      pipeline_id: defaultPipeline?.id || '1',
      probability: defaultPipeline?.stages.find((s) => s.id === newDeal.stage)?.probability || 10,
      source: 'Manual',
      assigned_to: user?.id || 'user1',
      tags: [],
      activities: [],
    });
    setIsAddDialogOpen(false);
    setNewDeal({ name: '', company_id: '', value: 0, stage: 'lead', expected_close_date: '' });
    toast.success('Deal succesvol aangemaakt');
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Beheer je verkoopkansen en pipeline per fase</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nieuwe verkoopkans aanmaken</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Naam van de deal</Label>
                <Input
                  value={newDeal.name}
                  onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                  placeholder="bijv. Licentieovereenkomst Q4"
                />
              </div>
              <div className="space-y-2">
                <Label>Bedrijfstoewijzing</Label>
                <Input
                  value={userCompanyName}
                  disabled
                  className="bg-muted/40 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Gekoppeld aan {userCompanyName} {isCorePartner ? '(gedeeld met CRMos kernpartners)' : '(strikt geïsoleerd)'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Waarde (€)</Label>
                <Input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fase</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={newDeal.stage}
                  onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                >
                  {defaultPipeline?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Verwachte sluitdatum</Label>
                <Input
                  type="date"
                  value={newDeal.expected_close_date}
                  onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                />
              </div>
              <Button onClick={handleAddDeal}>Deal opslaan</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  ? `Admin Masterview (${accessibleDeals.length} deals zichtbaar)`
                  : isCorePartner
                  ? `CRMos Core Dataset (${accessibleDeals.length} deals)`
                  : `${userCompanyName} Workspace (${accessibleDeals.length} deals)`}
              </p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {isSuperAdmin
                  ? (adminCompanyFilter === 'all' ? 'Alle Bedrijven' : adminCompanyFilter)
                  : userCompanyName}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? 'Als administrator heb je overkoepelend toezicht en kun je verkoopresultaten van alle organisaties inzien.'
                : isCorePartner
                ? 'Deze deals zijn onderdeel van de CRMos bedrijfsketen en gedeeld met CRMos, VVC, Quantum Initium, Logs Rent, Djobba en Trusting Work.'
                : `Strikte data-isolatie actief: Deze deals zijn uitsluitend zichtbaar voor medewerkers van ${userCompanyName}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pipeline Waarde</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gewonnen Omzet</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(wonValue)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Actieve Deals</p>
            <p className="text-2xl font-bold">
              {accessibleDeals.filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">
              {accessibleDeals.filter((d) => d.stage === 'closed-won' || d.stage === 'closed-lost').length > 0
                ? Math.round(
                    (accessibleDeals.filter((d) => d.stage === 'closed-won').length /
                      accessibleDeals.filter((d) => d.stage === 'closed-won' || d.stage === 'closed-lost').length) *
                      100
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek deals..."
            className="pl-10 rounded-full text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {defaultPipeline?.stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={searchQuery ? filteredDeals : accessibleDeals}
              onEdit={handleStartEdit}
              onViewDetails={setViewingDeal}
              onDelete={handleDeleteDeal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <DealCard
              deal={activeDeal}
              isOverlay
              onEdit={handleStartEdit}
              onViewDetails={setViewingDeal}
              onDelete={handleDeleteDeal}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* View Deal Details Modal */}
      <Dialog open={!!viewingDeal} onOpenChange={(open) => !open && setViewingDeal(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span className="truncate">{viewingDeal?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {viewingDeal && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Verkoopwaarde</span>
                <span className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  {formatCurrency(viewingDeal.value)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Bedrijf</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {viewingDeal.company_name || 'Geen toewijzing'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Pipeline Fase</span>
                  <Badge variant="secondary" className="capitalize text-xs font-semibold">
                    {defaultPipeline?.stages.find((s) => s.id === viewingDeal.stage)?.name || viewingDeal.stage}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Slagingskans</span>
                  <p className="font-semibold text-xs">{viewingDeal.probability}%</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Verwachte Sluitdatum</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {viewingDeal.expected_close_date
                      ? new Date(viewingDeal.expected_close_date).toLocaleDateString('nl-NL')
                      : 'Niet ingesteld'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => handleDeleteDeal(viewingDeal)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Verwijderen
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewingDeal(null)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const d = viewingDeal;
                      setViewingDeal(null);
                      handleStartEdit(d);
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

      {/* Edit Deal Modal */}
      <Dialog open={!!editingDeal} onOpenChange={(open) => !open && setEditingDeal(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Verkoopkans bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Naam van de deal</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Naam van verkoopkans"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Waarde (€)</Label>
              <Input
                type="number"
                value={editFormData.value}
                onChange={(e) => setEditFormData({ ...editFormData, value: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pipeline Fase</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                value={editFormData.stage}
                onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
              >
                {defaultPipeline?.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slagingskans ({editFormData.probability}%)</Label>
              <Input
                type="range"
                min={0}
                max={100}
                step={5}
                value={editFormData.probability}
                onChange={(e) => setEditFormData({ ...editFormData, probability: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Verwachte sluitdatum</Label>
              <Input
                type="date"
                value={editFormData.expected_close_date}
                onChange={(e) => setEditFormData({ ...editFormData, expected_close_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingDeal(null)}>
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
