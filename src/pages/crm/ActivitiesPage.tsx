import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
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
import type { Activity } from '@/types';

export function ActivitiesPage() {
  const { activities, contacts, deals, addActivity, completeActivity, deleteActivity } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'task' as Activity['type'],
    title: '',
    description: '',
    due_date: '',
    related_to: { type: 'contact' as const, id: '' },
  });

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || activity.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getRelatedName = (activity: typeof activities[0]) => {
    if (activity.related_to.type === 'contact') {
      const contact = contacts.find((c) => c.id === activity.related_to.id);
      return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    }
    if (activity.related_to.type === 'deal') {
      const deal = deals.find((d) => d.id === activity.related_to.id);
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
      assigned_to: 'user1',
    });
    setIsAddDialogOpen(false);
    setNewActivity({
      type: 'task' as Activity['type'],
      title: '',
      description: '',
      due_date: '',
      related_to: { type: 'contact', id: '' },
    });
    toast.success('Activity created');
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
      header: 'Title',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'related',
      header: 'Related To',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{row.original.related_to.type}</Badge>
          <span>{getRelatedName(row.original)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        row.original.due_date ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={new Date(row.original.due_date) < new Date() && row.original.status === 'pending' ? 'text-red-500' : ''}>
              {format(new Date(row.original.due_date), 'MMM d, yyyy')}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof activities[0] } }) => (
        <div className="flex items-center gap-2">
          {row.original.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                completeActivity(row.original.id);
                toast.success('Activity completed');
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteActivity(row.original.id)} className="text-destructive">
                Delete
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
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">Track your tasks, calls, meetings, and more</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as Activity['type'] })}
                >
                  <option value="task">Task</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="datetime-local"
                  value={newActivity.due_date}
                  onChange={(e) => setNewActivity({ ...newActivity, due_date: e.target.value })}
                />
              </div>
              <Button onClick={handleAddActivity}>Create Activity</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Activities</p>
            <p className="text-2xl font-bold">{activities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-orange-500">
              {activities.filter((a) => a.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed Today</p>
            <p className="text-2xl font-bold text-green-500">
              {activities.filter((a) => 
                a.status === 'completed' && 
                a.completed_at && 
                new Date(a.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-500">
              {activities.filter((a) => 
                a.status === 'pending' && 
                a.due_date && 
                new Date(a.due_date) < new Date()
              ).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
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
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredActivities} />
    </div>
  );
}
