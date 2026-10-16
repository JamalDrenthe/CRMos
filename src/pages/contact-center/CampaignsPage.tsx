import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/common/DataTable';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser } from '@/lib/companyAccess';
import { isCoreEcosystemCompany } from '@/types';
import {
  Plus,
  Search,
  MoreHorizontal,
  TrendingUp,
  Play,
  Pause,
  Edit,
  Eye,
  Filter,
  Layers,
  ShieldCheck,
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

export function CampaignsPage() {
  const { campaigns, startCampaign, pauseCampaign, updateCampaign, deleteCampaign } = useContactCenterStore();
  const { user, adminCompanyFilter } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<typeof campaigns[0] | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<typeof campaigns[0] | null>(null);
  const [editCampaignData, setEditCampaignData] = useState({
    name: '',
    description: '',
    target_contacts: 500,
  });

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<'outbound' | 'inbound'>('outbound');
  const [newTargetContacts, setNewTargetContacts] = useState(500);

  const isCore = isCoreEcosystemCompany(user?.company_name);

  const accessibleCampaigns = useMemo(
    () => filterRecordsForUser(user, campaigns, adminCompanyFilter),
    [user, campaigns, adminCompanyFilter]
  );

  const filteredCampaigns = accessibleCampaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (campaign: typeof campaigns[0]) => {
    setEditingCampaign(campaign);
    setEditCampaignData({
      name: campaign.name,
      description: campaign.description || '',
      target_contacts: campaign.target_contacts,
    });
  };

  const handleSaveEdit = () => {
    if (!editingCampaign) return;
    updateCampaign(editingCampaign.id, {
      name: editCampaignData.name.trim() || editingCampaign.name,
      description: editCampaignData.description,
      target_contacts: Number(editCampaignData.target_contacts) || 100,
    });
    setEditingCampaign(null);
    if (viewingCampaign?.id === editingCampaign.id) {
      setViewingCampaign((prev) =>
        prev
          ? {
              ...prev,
              name: editCampaignData.name.trim() || prev.name,
              description: editCampaignData.description,
              target_contacts: Number(editCampaignData.target_contacts) || 100,
            }
          : null
      );
    }
    toast.success('Campagne succesvol bijgewerkt');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Campaign',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span>{row.original.completed_contacts}</span>
            <span>{row.original.target_contacts}</span>
          </div>
          <Progress 
            value={(row.original.completed_contacts / row.original.target_contacts) * 100} 
            className="h-2"
          />
        </div>
      ),
    },
    {
      accessorKey: 'conversion',
      header: 'Conversion',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span>{row.original.conversion_rate}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <Badge
          variant={
            row.original.status === 'active'
              ? 'default'
              : row.original.status === 'paused'
              ? 'secondary'
              : 'outline'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof campaigns[0] } }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'active' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { pauseCampaign(row.original.id); toast.success('Campaign paused'); }}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {row.original.status === 'paused' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { startCampaign(row.original.id); toast.success('Campaign started'); }}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setViewingCampaign(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Details & Data</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStartEdit(row.original)}
                className="gap-2 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Bewerken</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  deleteCampaign(row.original.id);
                  toast.success('Campagne verwijderd');
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

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) {
      toast.error('Vul een campagnenaam in');
      return;
    }
    useContactCenterStore.getState().addCampaign({
      name: newCampaignName.trim(),
      description: newCampaignDesc.trim(),
      type: newCampaignType,
      status: 'active',
      target_contacts: newTargetContacts,
      completed_contacts: 0,
      conversion_rate: 0,
      assigned_agents: [user?.id || 'agent1'],
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });
    setIsAddDialogOpen(false);
    setNewCampaignName('');
    setNewCampaignDesc('');
    toast.success('Belcampagne succesvol gestart');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Belcampagnes</h1>
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
            Beheer commerciële telemarketingcampagnes, bellijsten en agenttoewijzing.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nieuwe Belcampagne Starten</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Campagnenaam</Label>
                <Input
                  placeholder="bijv. MKB Zonne-energie B2B Outreach"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Input
                  placeholder="Korte doelstelling van de campagne..."
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campagnetype</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newCampaignType}
                    onChange={(e) => setNewCampaignType(e.target.value as 'outbound' | 'inbound')}
                  >
                    <option value="outbound">Outbound (Koud/Warm Bellen)</option>
                    <option value="inbound">Inbound (Klantenservice / Leads)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Doelaantal Contacten</Label>
                  <Input
                    type="number"
                    value={newTargetContacts}
                    onChange={(e) => setNewTargetContacts(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign}>
                Campagne Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totaal Campagnes</p>
            <p className="text-2xl font-bold">{accessibleCampaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actief</p>
            <p className="text-2xl font-bold text-green-500">
              {accessibleCampaigns.filter((c) => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Doel Contacten</p>
            <p className="text-2xl font-bold">
              {accessibleCampaigns.reduce((sum, c) => sum + c.target_contacts, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gem. Conversie</p>
            <p className="text-2xl font-bold text-purple-500">
              {accessibleCampaigns.length > 0
                ? (accessibleCampaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / accessibleCampaigns.length).toFixed(1)
                : '0.0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredCampaigns}
        onRowClick={(row) => setViewingCampaign(row)}
      />

      {/* View Campaign Details Modal */}
      <Dialog open={!!viewingCampaign} onOpenChange={(open) => !open && setViewingCampaign(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span className="truncate">{viewingCampaign?.name}</span>
              <Badge variant="secondary" className="capitalize text-xs font-semibold">
                {viewingCampaign?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {viewingCampaign && (
            <div className="space-y-4 py-2 text-sm">
              <p className="text-xs text-muted-foreground">{viewingCampaign.description || 'Geen toelichting'}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Campagnetype</span>
                  <p className="font-semibold text-xs capitalize">{viewingCampaign.type}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Doel Contacten</span>
                  <p className="font-semibold text-xs">{viewingCampaign.target_contacts}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Voltooide Gesprekken</span>
                  <p className="font-semibold text-xs">{viewingCampaign.completed_contacts}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Succesvolle Conversie</span>
                  <p className="font-semibold text-xs text-emerald-600 font-mono">{viewingCampaign.conversion_rate}%</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => {
                    deleteCampaign(viewingCampaign.id);
                    setViewingCampaign(null);
                    toast.success('Campagne verwijderd');
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Verwijderen
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewingCampaign(null)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const c = viewingCampaign;
                      setViewingCampaign(null);
                      handleStartEdit(c);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Bewerken
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Campagne bewerken</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Campagnenaam</Label>
              <Input
                value={editCampaignData.name}
                onChange={(e) => setEditCampaignData({ ...editCampaignData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Doel Contacten</Label>
              <Input
                type="number"
                value={editCampaignData.target_contacts}
                onChange={(e) => setEditCampaignData({ ...editCampaignData, target_contacts: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Omschrijving</Label>
              <Input
                value={editCampaignData.description}
                onChange={(e) => setEditCampaignData({ ...editCampaignData, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditingCampaign(null)}>
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
