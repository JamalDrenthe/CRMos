import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import type { Territory } from '@/types';
import {
  Plus,
  Search,
  Users,
  Briefcase,
  Euro,
  Edit,
  Trash2,
  MoreHorizontal,
  Map,
  ChevronLeft,
  ChevronRight,
  Table,
  DownloadCloud,
  Sparkles,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RayonMap } from '@/components/maps/RayonMap';
import { useD2DStore } from '@/stores/d2dStore';

export function TerritoriesPage() {
  const { territories, addTerritory, updateTerritory, deleteTerritory } = useEnhancedStore();
  const { pins: d2dPins, fetchAddressesFromPDOK, autoSyncKadasterTerritory, isImporting } = useD2DStore();
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [selectedTerritoryIdForMapTab, setSelectedTerritoryIdForMapTab] = useState<string>('all');
  const [autoKadasterSync, setAutoKadasterSync] = useState<boolean>(true);
  const [pdokPostcode, setPdokPostcode] = useState('');
  const [isPdokDialogOpen, setIsPdokDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTerritory, setNewTerritory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    postcode_prefixes: '',
  });

  const syncedTerritoriesRef = useRef<Set<string>>(new Set());

  // Automatisch Kadaster BAG adressen ophalen als standaard voor de actieve regio (eenmalig per sessie)
  useEffect(() => {
    if (!autoKadasterSync) return;

    const targetTerritory = selectedTerritoryIdForMapTab === 'all'
      ? territories[0]
      : territories.find((t) => t.id === selectedTerritoryIdForMapTab);

    if (targetTerritory && !syncedTerritoriesRef.current.has(targetTerritory.id)) {
      syncedTerritoriesRef.current.add(targetTerritory.id);
      autoSyncKadasterTerritory(targetTerritory);
    }
  }, [selectedTerritoryIdForMapTab, territories, autoKadasterSync, autoSyncKadasterTerritory]);

  // Modal states
  const [selectedTerritoryForMap, setSelectedTerritoryForMap] = useState<Territory | null>(null);
  const [selectedTerritoryForEdit, setSelectedTerritoryForEdit] = useState<Territory | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    postcode_prefixes: '',
  });

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredTerritories = territories.filter(
    (territory) =>
      territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      territory.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredTerritories.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTerritories = filteredTerritories.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  const handleAddTerritory = () => {
    if (!newTerritory.name.trim()) {
      toast.error('Vul een regionaam in');
      return;
    }
    const prefixes = newTerritory.postcode_prefixes
      ? newTerritory.postcode_prefixes.split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    const createdTerr: Territory = {
      id: `terr_${Date.now()}`,
      name: newTerritory.name,
      description: newTerritory.description,
      color: newTerritory.color,
      geometry: { type: 'Polygon', coordinates: [] },
      agent_ids: [],
      postcode_prefixes: prefixes,
      metrics: {
        contacts_count: 0,
        deals_count: 0,
        revenue: 0,
        last_updated: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addTerritory(createdTerr);
    if (autoKadasterSync) {
      autoSyncKadasterTerritory(createdTerr);
    }
    setIsAddDialogOpen(false);
    setNewTerritory({ name: '', description: '', color: '#3b82f6', postcode_prefixes: '' });
    toast.success('Regio succesvol aangemaakt (Kadaster BAG adressen gekoppeld)');
  };

  const openEditModal = (territory: Territory) => {
    setSelectedTerritoryForEdit(territory);
    setEditForm({
      name: territory.name,
      description: territory.description || '',
      color: territory.color || '#3b82f6',
      postcode_prefixes: territory.postcode_prefixes?.join(', ') || '',
    });
  };

  const handleSaveEdit = () => {
    if (!selectedTerritoryForEdit) return;
    if (!editForm.name.trim()) {
      toast.error('Vul een regionaam in');
      return;
    }
    const prefixes = editForm.postcode_prefixes
      ? editForm.postcode_prefixes.split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    updateTerritory(selectedTerritoryForEdit.id, {
      name: editForm.name,
      description: editForm.description,
      color: editForm.color,
      postcode_prefixes: prefixes,
    });
    setSelectedTerritoryForEdit(null);
    toast.success('Regio bijgewerkt');
  };

  const handleDelete = (territory: Territory) => {
    deleteTerritory(territory.id);
    toast.success(`Regio "${territory.name}" verwijderd`);
  };

  const handleImportPDOK = async () => {
    if (!pdokPostcode.trim()) {
      toast.error('Voer een postcode (bijv. 1012) of plaatsnaam in');
      return;
    }
    const res = await fetchAddressesFromPDOK(pdokPostcode.trim());
    if (res.success) {
      toast.success(`${res.count} adressen succesvol geïmporteerd vanuit Kadaster (PDOK/BAG)`);
      setIsPdokDialogOpen(false);
      setPdokPostcode('');
    } else {
      toast.error('Geen adressen gevonden voor deze invoer via PDOK Locatieserver');
    }
  };

  const d2dMetrics = {
    total: d2dPins.length,
    deal_closed: d2dPins.filter((p) => p.current_status === 'deal_closed').length,
    not_home: d2dPins.filter((p) => p.current_status === 'not_home').length,
    no_interest: d2dPins.filter((p) => p.current_status === 'no_interest').length,
    appointment: d2dPins.filter((p) => p.current_status === 'appointment').length,
    do_not_knock: d2dPins.filter((p) => p.current_status === 'do_not_knock').length,
    unvisited: d2dPins.filter((p) => !p.current_status || p.current_status === 'unvisited').length,
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Regio / Gebied',
      cell: ({ row }: { row: { original: Territory } }) => (
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setSelectedTerritoryForMap(row.original)}
        >
          <div 
            className="h-4 w-4 rounded-full ring-2 ring-background group-hover:scale-110 transition-transform" 
            style={{ backgroundColor: row.original.color }}
          />
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">{row.original.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'agents',
      header: 'Toegewezen Agenten',
      cell: ({ row }: { row: { original: Territory } }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.agent_ids.length}</span>
        </div>
      ),
    },
    {
      accessorKey: 'metrics',
      header: 'Contacten',
      cell: ({ row }: { row: { original: Territory } }) => (
        <span className="font-medium">{row.original.metrics?.contacts_count || 0}</span>
      ),
    },
    {
      accessorKey: 'deals',
      header: 'Deals',
      cell: ({ row }: { row: { original: Territory } }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.metrics?.deals_count || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Omzet',
      cell: ({ row }: { row: { original: Territory } }) => (
        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <Euro className="h-4 w-4" />
          <span>{(row.original.metrics?.revenue || 0).toLocaleString('nl-NL')}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Territory } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setSelectedTerritoryForMap(row.original)}>
              <Map className="mr-2 h-4 w-4 text-blue-500" />
              Kaart Weergave
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditModal(row.original)}>
              <Edit className="mr-2 h-4 w-4 text-amber-500" />
              Bewerken
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original)}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">Verkoopregio's & D2D Kaarten</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5">
              Mapbox & Kadaster
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Geavanceerd rayonbeheer, vector polygonen en Field Sales Door-to-Door adresregistratie
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border bg-muted/40 p-1 shadow-sm">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-lg text-xs gap-1.5 h-8 px-3"
            >
              <Map className="h-3.5 w-3.5" />
              Interactieve Kaart
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-lg text-xs gap-1.5 h-8 px-3"
            >
              <Table className="h-3.5 w-3.5" />
              Tabeloverzicht
            </Button>
          </div>

          {/* Kadaster BAG Default Status Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer shadow-sm hover:bg-blue-500/15 transition-all"
            title="Kadaster BAG adresgegevens worden standaard automatisch opgehaald voor elk rayon"
            onClick={() => {
              setAutoKadasterSync((prev) => {
                toast.info(!prev ? 'Automatische Kadaster BAG synchronisatie ingeschakeld' : 'Kadaster BAG synchronisatie gepauzeerd');
                return !prev;
              });
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoKadasterSync ? 'bg-emerald-400 opacity-75' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoKadasterSync ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span>Kadaster BAG: {autoKadasterSync ? 'Standaard Actief' : 'Gepauzeerd'}</span>
          </div>

          {/* Import Kadaster PDOK Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPdokDialogOpen(true)}
            className="rounded-xl border-blue-500/30 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1.5 h-8 text-xs font-medium"
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            Importeer Kadaster (BAG)
          </Button>

          {/* New Territory Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl shadow-sm h-8 text-xs font-medium gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Nieuwe Regio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Nieuwe Regio Aanmaken</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-3">
                <div className="space-y-1.5">
                  <Label>Regionaam</Label>
                  <Input
                    value={newTerritory.name}
                    onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })}
                    placeholder="bijv. Randstad Noord of West-Europa"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Omschrijving / Steden</Label>
                  <Input
                    value={newTerritory.description}
                    onChange={(e) => setNewTerritory({ ...newTerritory, description: e.target.value })}
                    placeholder="bijv. Amsterdam, Haarlem, Alkmaar"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Postcode prefixen (komma-gescheiden)</Label>
                  <Input
                    value={newTerritory.postcode_prefixes}
                    onChange={(e) => setNewTerritory({ ...newTerritory, postcode_prefixes: e.target.value })}
                    placeholder="bijv. 10, 11, 20, 21"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Themakleur</Label>
                  <div className="flex gap-2.5">
                    {['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                          newTerritory.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTerritory({ ...newTerritory, color })}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddTerritory} className="w-full mt-2 rounded-xl">
                  Regio Opslaan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Actieve Regio's</p>
            <p className="text-2xl font-bold mt-1">{territories.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">D2D Adressen (BAG)</p>
            <p className="text-2xl font-bold mt-1 text-primary">{d2dMetrics.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Gesloten D2D Deals</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {d2dMetrics.deal_closed}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Gezamenlijke Omzet</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              €{territories.reduce((sum, t) => sum + (t.metrics?.revenue || 0), 0).toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-4">
          {/* Rayon selection pills & D2D quick metrics */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-muted/20 border rounded-2xl">
            {/* Territory Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <Button
                variant={selectedTerritoryIdForMapTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTerritoryIdForMapTab('all')}
                className="rounded-xl h-8 text-xs shrink-0"
              >
                Alle Regio's ({territories.length})
              </Button>
              {territories.map((t) => (
                <Button
                  key={t.id}
                  variant={selectedTerritoryIdForMapTab === t.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTerritoryIdForMapTab(t.id)}
                  className="rounded-xl h-8 text-xs shrink-0 gap-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color || '#3b82f6' }}
                  />
                  {t.name}
                </Button>
              ))}
            </div>

            {/* D2D Status Legend / Counters */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                Deal: {d2dMetrics.deal_closed}
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                Niet Thuis: {d2dMetrics.not_home}
              </Badge>
              <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                Afspraak: {d2dMetrics.appointment}
              </Badge>
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                Geen Int: {d2dMetrics.no_interest}
              </Badge>
              <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 font-medium">
                Niet Aanbellen: {d2dMetrics.do_not_knock}
              </Badge>
            </div>
          </div>

          {/* Main Rayon Map */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <RayonMap
              territory={
                selectedTerritoryIdForMapTab === 'all'
                  ? null
                  : territories.find((t) => t.id === selectedTerritoryIdForMapTab) || null
              }
              className="h-[620px] w-full"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek regio's op naam of gebied..."
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
            <DataTable columns={columns} data={paginatedTerritories} />
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
            <p>
              Weergave van{' '}
              <span className="font-semibold text-foreground">
                {filteredTerritories.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}
              </span>{' '}
              t/m{' '}
              <span className="font-semibold text-foreground">
                {Math.min(validCurrentPage * pageSize, filteredTerritories.length)}
              </span>{' '}
              van <span className="font-semibold text-foreground">{filteredTerritories.length}</span> regio's
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
        </div>
      )}

      {/* Map View Dialog */}
      <Dialog open={!!selectedTerritoryForMap} onOpenChange={(open) => !open && setSelectedTerritoryForMap(null)}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div 
                className="h-4 w-4 rounded-full" 
                style={{ backgroundColor: selectedTerritoryForMap?.color }}
              />
              <DialogTitle className="text-xl">{selectedTerritoryForMap?.name}</DialogTitle>
            </div>
          </DialogHeader>

          {selectedTerritoryForMap && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">{selectedTerritoryForMap.description}</p>

              {/* Interactive Vector Rayon Map */}
              <div className="rounded-2xl border overflow-hidden shadow-inner">
                <RayonMap territory={selectedTerritoryForMap} className="h-72 w-full" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xs text-muted-foreground">Contacten</p>
                  <p className="text-lg font-bold mt-0.5">{selectedTerritoryForMap.metrics?.contacts_count || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xs text-muted-foreground">Deals</p>
                  <p className="text-lg font-bold mt-0.5">{selectedTerritoryForMap.metrics?.deals_count || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xs text-muted-foreground">Omzet</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    €{(selectedTerritoryForMap.metrics?.revenue || 0).toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>

              {/* Postcode Prefixes */}
              {selectedTerritoryForMap.postcode_prefixes && selectedTerritoryForMap.postcode_prefixes.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Postcode Prefixen:</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTerritoryForMap.postcode_prefixes.map((pref) => (
                      <Badge key={pref} variant="secondary" className="text-xs font-mono">
                        {pref}*
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const terr = selectedTerritoryForMap;
                    setSelectedTerritoryForMap(null);
                    openEditModal(terr);
                  }}
                  className="rounded-xl"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Bewerken
                </Button>
                <Button onClick={() => setSelectedTerritoryForMap(null)} className="rounded-xl">
                  Sluiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Territory Dialog */}
      <Dialog open={!!selectedTerritoryForEdit} onOpenChange={(open) => !open && setSelectedTerritoryForEdit(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Regio Bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1.5">
              <Label>Regionaam</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Omschrijving / Steden</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Postcode prefixen (komma-gescheiden)</Label>
              <Input
                value={editForm.postcode_prefixes}
                onChange={(e) => setEditForm({ ...editForm, postcode_prefixes: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Themakleur</Label>
              <div className="flex gap-2.5">
                {['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                      editForm.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditForm({ ...editForm, color })}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedTerritoryForEdit(null)} className="rounded-xl">
                Annuleren
              </Button>
              <Button onClick={handleSaveEdit} className="rounded-xl">
                Wijzigingen Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDOK Kadaster BAG Importer Dialog */}
      <Dialog open={isPdokDialogOpen} onOpenChange={setIsPdokDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DownloadCloud className="h-5 w-5 text-blue-500" />
              Kadaster BAG Adressen Importeren
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Importeer officiële Nederlandse Kadaster BAG pand- en adrescoördinaten via de PDOK Locatieserver API. Ideaal voor direct aanbellen in Field Sales & Rayonbeheer.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Postcode of Straat + Plaats</Label>
              <Input
                placeholder="bijv. 1012 DH, Coolsingel Rotterdam, of 3511"
                value={pdokPostcode}
                onChange={(e) => setPdokPostcode(e.target.value)}
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleImportPDOK();
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground w-full">Snelle suggesties:</span>
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                onClick={() => setPdokPostcode('1012 DH Singel')}
              >
                1012 DH (Singel A'dam)
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                onClick={() => setPdokPostcode('3011 Coolsingel')}
              >
                3011 (Coolsingel R'dam)
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                onClick={() => setPdokPostcode('3511 Oudegracht')}
              >
                3511 (Oudegracht Utrecht)
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                PDOK Open Data (Gratis)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPdokDialogOpen(false)} className="rounded-xl">
                  Annuleren
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportPDOK}
                  disabled={isImporting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isImporting ? 'Importeren...' : 'Adressen Ophalen'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
