import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser } from '@/lib/companyAccess';
import { isCoreEcosystemCompany, type Activity } from '@/types';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  FileText,
  Target,
  Layers,
  ShieldCheck,
  Edit3,
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

export function ActivitiesPage() {
  const {
    activities,
    contacts,
    deals,
    addActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  } = useCRMStore();
  const { user, adminCompanyFilter } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: 'task' as Activity['type'],
    due_date: '',
    status: 'pending' as Activity['status'],
  });

  const [newActivity, setNewActivity] = useState({
    type: 'task' as Activity['type'],
    title: '',
    description: '',
    due_date: '',
    related_to: { type: 'contact' as const, id: '' },
  });

  const isCore = isCoreEcosystemCompany(user?.company_name);

  const accessibleActivities = useMemo(
    () => filterRecordsForUser(user, activities, adminCompanyFilter),
    [user, activities, adminCompanyFilter]
  );
  const accessibleContacts = useMemo(
    () => filterRecordsForUser(user, contacts, adminCompanyFilter),
    [user, contacts, adminCompanyFilter]
  );
  const accessibleDeals = useMemo(
    () => filterRecordsForUser(user, deals, adminCompanyFilter),
    [user, deals, adminCompanyFilter]
  );

  const filteredActivities = useMemo(() => {
    return accessibleActivities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filter === 'all' || activity.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [accessibleActivities, searchQuery, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const handleStartEdit = (act: Activity) => {
    setEditingActivity(act);
    setEditFormData({
      title: act.title,
      description: act.description || '',
      type: act.type,
      due_date: act.due_date ? new Date(act.due_date).toISOString().split('T')[0] : '',
      status: act.status,
    });
  };

  const handleSaveEdit = () => {
    if (!editingActivity) return;
    updateActivity(editingActivity.id, {
      title: editFormData.title.trim() || editingActivity.title,
      description: editFormData.description,
      type: editFormData.type,
      due_date: editFormData.due_date,
      status: editFormData.status,
      completed_at: editFormData.status === 'completed' ? new Date().toISOString() : undefined,
    });
    setEditingActivity(null);
    toast.success('Activiteit succesvol bijgewerkt');
  };

  const getRelatedName = (activity: typeof activities[0]) => {
    if (activity.related_to.type === 'contact') {
      const contact = accessibleContacts.find((c) => c.id === activity.related_to.id);
      return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    }
    if (activity.related_to.type === 'deal') {
      const deal = accessibleDeals.find((d) => d.id === activity.related_to.id);
      return deal?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAddActivity = () => {
    addActivity({
      ...newActivity,
      status: 'pending',
      assigned_to: user?.id || 'user1',
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });
    setIsAddDialogOpen(false);
    setNewActivity({
      type: 'task' as Activity['type'],
      title: '',
      description: '',
      due_date: '',
      related_to: { type: 'contact', id: '' },
    });
    toast.success('Activiteit succesvol ingepland');
  };

  const columns = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div className={`flex items-center gap-2 rounded-full p-2 w-fit ${
          row.original.type === 'call' ? 'bg-blue-500/10 text-blue-500' :
          row.original.type === 'email' ? 'bg-green-500/10 text-green-500' :
          row.original.type === 'meeting' ? 'bg-purple-500/10 text-purple-500' :
          row.original.type === 'task' ? 'bg-orange-500/10 text-orange-500' :
          'bg-gray-500/10 text-gray-500'
        }`}>
          {getActivityIcon(row.original.type)}
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Titel',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'related',
      header: 'Gekoppeld aan',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize font-medium">{row.original.related_to.type}</Badge>
          <span className="text-xs">{getRelatedName(row.original)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Vervaldatum',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        row.original.due_date ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={new Date(row.original.due_date) < new Date() && row.original.status === 'pending' ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
              {format(new Date(row.original.due_date), 'd MMM yyyy')}
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
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-xs font-semibold">
          {row.original.status === 'completed' ? 'Afgerond' : 'In Behandeling'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.original.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              title="Afronden"
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => {
                completeActivity(row.original.id);
                toast.success('Activiteit afgerond');
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => handleStartEdit(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Bewerken</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  deleteActivity(row.original.id);
                  toast.success('Activiteit verwijderd');
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activiteiten</h1>
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
            Beheer taken, terugbelverzoeken, afspraken en notities binnen jouw bedrijf.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Activiteit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nieuwe Activiteit Plannen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as Activity['type'] })}
                >
                  <option value="task">Taak (Follow-up)</option>
                  <option value="call">Telefoongesprek</option>
                  <option value="email">E-mail</option>
                  <option value="meeting">Afspraak / Meeting</option>
                  <option value="note">Notitie</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={newActivity.title}
                  placeholder="bijv. Terugbellen offerte bespreking"
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Input
                  value={newActivity.description}
                  placeholder="Korte toelichting of actiepunten"
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vervaldatum &amp; Tijd</Label>
                <Input
                  type="datetime-local"
                  value={newActivity.due_date}
                  onChange={(e) => setNewActivity({ ...newActivity, due_date: e.target.value })}
                />
              </div>
              <Button onClick={handleAddActivity}>Activiteit Aanmaken</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totaal Activiteiten</p>
            <p className="text-2xl font-bold">{accessibleActivities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Behandeling</p>
            <p className="text-2xl font-bold text-orange-500">
              {accessibleActivities.filter((a) => a.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Vandaag Afgerond</p>
            <p className="text-2xl font-bold text-green-500">
              {accessibleActivities.filter((a) => 
                a.status === 'completed' && 
                a.completed_at && 
                new Date(a.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Verlopen</p>
            <p className="text-2xl font-bold text-red-500">
              {accessibleActivities.filter((a) => 
                a.status === 'pending' && 
                a.due_date && 
                new Date(a.due_date) < new Date()
              ).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Zoek activiteiten..."
              className="pl-9 h-10 rounded-xl text-xs"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/50">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg h-7 text-xs px-3"
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
            >
              Alle ({accessibleActivities.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg h-7 text-xs px-3"
              onClick={() => { setFilter('pending'); setCurrentPage(1); }}
            >
              In Behandeling ({accessibleActivities.filter((a) => a.status === 'pending').length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg h-7 text-xs px-3"
              onClick={() => { setFilter('completed'); setCurrentPage(1); }}
            >
              Afgerond ({accessibleActivities.filter((a) => a.status === 'completed').length})
            </Button>
          </div>
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
          data={paginatedActivities}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          {filteredActivities.length > 0 ? (
            <span>
              Toont{' '}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              tot{' '}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredActivities.length)}
              </strong>{' '}
              van <strong className="text-foreground">{filteredActivities.length}</strong>{' '}
              activiteiten
            </span>
          ) : (
            <span>0 activiteiten gevonden</span>
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

      {/* Edit Activity Modal */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Activiteit bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Titel</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as Activity['type'] })}
                >
                  <option value="call">Bellen</option>
                  <option value="email">Email</option>
                  <option value="meeting">Afspraak / Meeting</option>
                  <option value="task">Taak</option>
                  <option value="note">Notitie</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Activity['status'] })}
                >
                  <option value="pending">In Behandeling</option>
                  <option value="completed">Afgerond</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vervaldatum</Label>
              <Input
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Omschrijving / Notities</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Toelichting of gespreksnotitie..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingActivity(null)}>
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
