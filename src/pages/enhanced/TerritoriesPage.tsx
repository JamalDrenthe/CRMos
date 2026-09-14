import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import {
  Plus,
  Search,
  Users,
  Briefcase,
  DollarSign,
  Edit,
  Trash2,
  MoreHorizontal,
  Map,
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

export function TerritoriesPage() {
  const { territories, addTerritory } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTerritory, setNewTerritory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const filteredTerritories = territories.filter(
    (territory) =>
      territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      territory.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTerritory = () => {
    addTerritory({
      ...newTerritory,
      geometry: { type: 'Polygon', coordinates: [] },
      agent_ids: [],
    });
    setIsAddDialogOpen(false);
    setNewTerritory({ name: '', description: '', color: '#3b82f6' });
    toast.success('Territory created');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Territory',
      cell: ({ row }: { row: { original: typeof territories[0] } }) => (
        <div className="flex items-center gap-3">
          <div 
            className="h-4 w-4 rounded-full" 
            style={{ backgroundColor: row.original.color }}
          />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'agents',
      header: 'Assigned Agents',
      cell: ({ row }: { row: { original: typeof territories[0] } }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.agent_ids.length}</span>
        </div>
      ),
    },
    {
      accessorKey: 'metrics',
      header: 'Contacts',
      cell: ({ row }: { row: { original: typeof territories[0] } }) => (
        <span>{row.original.metrics?.contacts_count || 0}</span>
      ),
    },
    {
      accessorKey: 'deals',
      header: 'Deals',
      cell: ({ row }: { row: { original: typeof territories[0] } }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.metrics?.deals_count || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }: { row: { original: typeof territories[0] } }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span>${(row.original.metrics?.revenue || 0).toLocaleString()}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Map className="mr-2 h-4 w-4" />
              View Map
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
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
          <h1 className="text-3xl font-bold">Territories</h1>
          <p className="text-muted-foreground">Manage geographic sales territories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Territory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Territory</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newTerritory.name}
                  onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })}
                  placeholder="e.g., West Coast"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newTerritory.description}
                  onChange={(e) => setNewTerritory({ ...newTerritory, description: e.target.value })}
                  placeholder="e.g., California, Oregon, Washington"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full ${newTerritory.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTerritory({ ...newTerritory, color })}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAddTerritory}>Create Territory</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Territories</p>
            <p className="text-2xl font-bold">{territories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Agents</p>
            <p className="text-2xl font-bold">
              {new Set(territories.flatMap((t) => t.agent_ids)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">
              {territories.reduce((sum, t) => sum + (t.metrics?.contacts_count || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-500">
              ${territories.reduce((sum, t) => sum + (t.metrics?.revenue || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search territories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredTerritories} />
    </div>
  );
}
