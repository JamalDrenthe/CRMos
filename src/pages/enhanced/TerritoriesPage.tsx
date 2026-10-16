import { useState } from 'react';
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
  MapPin,
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function TerritoriesPage() {
  const { territories, addTerritory, updateTerritory, deleteTerritory } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTerritory, setNewTerritory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    postcode_prefixes: '',
  });

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

    addTerritory({
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
    });
    setIsAddDialogOpen(false);
    setNewTerritory({ name: '', description: '', color: '#3b82f6', postcode_prefixes: '' });
    toast.success('Regio succesvol aangemaakt');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verkoopregio's & Gebieden</h1>
          <p className="text-muted-foreground mt-1">
            Beheer geografische marktgebieden, rayonverdeling en commerciële prestaties
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Actieve Regio's</p>
            <p className="text-2xl font-bold mt-1">{territories.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Toegewezen Agenten</p>
            <p className="text-2xl font-bold mt-1">
              {new Set(territories.flatMap((t) => t.agent_ids)).size}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Totale Contacten</p>
            <p className="text-2xl font-bold mt-1">
              {territories.reduce((sum, t) => sum + (t.metrics?.contacts_count || 0), 0).toLocaleString('nl-NL')}
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

              {/* Simulated Map Visualizer */}
              <div className="relative h-56 rounded-2xl border bg-muted/30 overflow-hidden flex flex-col items-center justify-center p-4">
                <div 
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div 
                  className="relative p-6 rounded-2xl border shadow-lg backdrop-blur bg-background/80 flex flex-col items-center text-center max-w-sm"
                  style={{ borderColor: selectedTerritoryForMap.color }}
                >
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center mb-2 shadow"
                    style={{ backgroundColor: `${selectedTerritoryForMap.color}20`, color: selectedTerritoryForMap.color }}
                  >
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-foreground">{selectedTerritoryForMap.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Geografische polygoon dekking actief
                  </p>
                </div>
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
    </div>
  );
}
