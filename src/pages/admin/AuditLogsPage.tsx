import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { format } from 'date-fns';
import {
  Search,
  Download,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Shield,
} from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  deal_created: Plus,
  deal_updated: Edit,
  deal_deleted: Trash2,
  contact_created: Plus,
  contact_updated: Edit,
  contact_deleted: Trash2,
  user_login: User,
  user_logout: User,
  settings_changed: Shield,
};

const actionColors: Record<string, string> = {
  deal_created: 'text-green-500',
  deal_updated: 'text-blue-500',
  deal_deleted: 'text-red-500',
  contact_created: 'text-green-500',
  contact_updated: 'text-blue-500',
  contact_deleted: 'text-red-500',
  user_login: 'text-purple-500',
  user_logout: 'text-gray-500',
  settings_changed: 'text-orange-500',
};

export function AuditLogsPage() {
  const { auditLogs } = useEnhancedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'deals' | 'contacts' | 'users'>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'deals') return matchesSearch && log.entity_type === 'deal';
    if (filter === 'contacts') return matchesSearch && log.entity_type === 'contact';
    if (filter === 'users') return matchesSearch && log.action.includes('user');
    return matchesSearch;
  });

  const columns = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: { row: { original: typeof auditLogs[0] } }) => {
        const Icon = actionIcons[row.original.action] || Eye;
        const colorClass = actionColors[row.original.action] || 'text-muted-foreground';
        return (
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 bg-muted ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium capitalize">{row.original.action.replace(/_/g, ' ')}</p>
              <p className="text-sm text-muted-foreground">{row.original.entity_type}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }: { row: { original: typeof auditLogs[0] } }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.user_name || row.original.user_id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }: { row: { original: typeof auditLogs[0] } }) => (
        <div className="text-sm">
          {row.original.new_values && (
            <span className="text-muted-foreground">
              {Object.entries(row.original.new_values).slice(0, 2).map(([key, value]) => (
                <span key={key} className="mr-2">{key}: {String(value).substring(0, 20)}</span>
              ))}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'ip',
      header: 'IP Address',
      cell: ({ row }: { row: { original: typeof auditLogs[0] } }) => (
        <Badge variant="outline">{row.original.ip_address || 'N/A'}</Badge>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }: { row: { original: typeof auditLogs[0] } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities for compliance</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Logs</p>
            <p className="text-2xl font-bold">{auditLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold text-green-500">
              {auditLogs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold text-blue-500">
              {auditLogs.filter((l) => new Date(l.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unique Users</p>
            <p className="text-2xl font-bold text-purple-500">
              {new Set(auditLogs.map((l) => l.user_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'deals' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('deals')}
          >
            Deals
          </Button>
          <Button
            variant={filter === 'contacts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('contacts')}
          >
            Contacts
          </Button>
          <Button
            variant={filter === 'users' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('users')}
          >
            Users
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredLogs} />
    </div>
  );
}
