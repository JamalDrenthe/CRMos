import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/common/DataTable';
import { Contact360View } from '@/components/360-view/Contact360View';
import { useCRMStore } from '@/stores/crmStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Building2,
  Star,
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

export function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contacts, addContact, deleteContact } = useCRMStore();
  const { addAuditLog } = useEnhancedStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    searchParams.get('id')
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'lead' as const,
    source: 'Manual',
    tags: [],
    custom_fields: {},
  });

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = () => {
    const contact = addContact(newContact);
    addAuditLog({
      action: 'contact_created',
      entity_type: 'contact',
      entity_id: contact.id,
      user_id: 'user1',
      user_name: 'Alex Johnson',
      new_values: newContact,
    });
    setIsAddDialogOpen(false);
    setNewContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'lead',
      source: 'Manual',
      tags: [],
      custom_fields: {},
    });
    toast.success('Contact created successfully');
  };

  const handleDeleteContact = (id: string) => {
    deleteContact(id);
    toast.success('Contact deleted');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback>
              {row.original.first_name[0]}{row.original.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </p>
            {row.original.title && (
              <p className="text-xs text-muted-foreground">{row.original.title}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a href={`mailto:${row.original.email}`} className="hover:underline">
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        row.original.company ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.company}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <Badge variant={
          row.original.status === 'customer' ? 'default' :
          row.original.status === 'prospect' ? 'secondary' :
          'outline'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: () => {
        const score = Math.floor(Math.random() * 40) + 60; // Simulated score
        return (
          <div className="flex items-center gap-2">
            <Star className={`h-4 w-4 ${score >= 80 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
            <span>{score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_contact',
      header: 'Last Contact',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        row.original.last_contact_at ? (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.last_contact_at), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof contacts[0] } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedContactId(row.original.id)}>
              View 360° Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/crm/contacts?id=${row.original.id}`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteContact(row.original.id)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contacts and relationships</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddContact}>Create Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Leads</p>
            <p className="text-2xl font-bold">
              {contacts.filter((c) => c.status === 'lead').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Prospects</p>
            <p className="text-2xl font-bold">
              {contacts.filter((c) => c.status === 'prospect').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Customers</p>
            <p className="text-2xl font-bold">
              {contacts.filter((c) => c.status === 'customer').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredContacts}
        onRowClick={(row) => setSelectedContactId(row.id)}
      />

      {/* 360 View Slide-over */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
