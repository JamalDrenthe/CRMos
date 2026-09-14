import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/common/DataTable';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import {
  Plus,
  Search,
  MoreHorizontal,
  TrendingUp,
  Play,
  Pause,
  Edit,
  Eye,
  BarChart3,
  Filter,
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

export function CampaignsPage() {
  const { campaigns, startCampaign, pauseCampaign } = useContactCenterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your outreach campaigns</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input placeholder="e.g., Q4 Enterprise Outreach" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Campaign description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Target Contacts</Label>
                  <Input type="number" placeholder="500" />
                </div>
              </div>
              <Button onClick={() => { setIsAddDialogOpen(false); toast.success('Campaign created'); }}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Campaigns</p>
            <p className="text-2xl font-bold">{campaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {campaigns.filter((c) => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.target_contacts, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Conversion</p>
            <p className="text-2xl font-bold text-purple-500">
              {(campaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / campaigns.length).toFixed(1)}%
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

      <DataTable columns={columns} data={filteredCampaigns} />
    </div>
  );
}
