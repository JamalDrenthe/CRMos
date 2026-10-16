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
  DollarSign,
  ShieldCheck,
  Lock,
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

interface DealCardProps {
  deal: ReturnType<typeof useCRMStore.getState>['deals'][0];
  isOverlay?: boolean;
}

function DealCard({ deal, isOverlay }: DealCardProps) {
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
      className={`rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isOverlay ? 'shadow-xl rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="font-medium text-sm line-clamp-2">{deal.name}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        <span className="truncate">{deal.company_name}</span>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <DollarSign className="h-3 w-3" />
          {formatCurrency(deal.value)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {deal.expected_close_date && new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
      
      <div className="mt-2">
        <Progress value={deal.probability} className="h-1" />
      </div>
      
      {deal.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
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
}

function StageColumn({ stage, deals }: StageColumnProps) {
  const stageDeals = deals.filter((d) => d.stage === stage.id);
  const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'Stage', stage },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-lg bg-muted/50 p-3 min-w-[280px] w-[280px]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-medium text-sm">{stage.name}</span>
          <Badge variant="secondary" className="text-xs">
            {stageDeals.length}
          </Badge>
        </div>
      </div>
      
      <div className="mb-3 text-xs text-muted-foreground">
        {formatCurrency(totalValue)}
      </div>
      
      <ScrollArea className="flex-1 -mx-1 px-1">
        <SortableContext
          items={stageDeals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px]">
            {stageDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function DealsPage() {
  const { pipelines, deals, moveDeal, addDeal } = useCRMStore();
  const { user, organization, adminCompanyFilter } = useAuthStore();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDeal, setActiveDeal] = useState<typeof deals[0] | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    company_id: '',
    value: 0,
    stage: 'lead',
    expected_close_date: '',
  });

  const defaultPipeline = pipelines[0];

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
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
