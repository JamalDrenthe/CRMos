import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCRMStore } from '@/stores/crmStore';
import { Contact360View } from '@/components/360-view/Contact360View';
import { Search, Star, TrendingUp, DollarSign, Phone, Mail, Calendar } from 'lucide-react';

export function View360Page() {
  const { contacts, getContact360 } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">360° Customer View</h1>
        <p className="text-muted-foreground">Complete view of your customer relationships</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => {
          const contact360 = getContact360(contact.id);
          return (
            <Card 
              key={contact.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedContactId(contact.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="text-lg">
                      {contact.first_name[0]}{contact.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold">{contact.first_name} {contact.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                    <p className="text-sm text-muted-foreground">{contact.company}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold">{contact360?.score || 0}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">${contact360?.lifetime_value.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">Lifetime Value</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{contact360?.interactions_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Interactions</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact360?.emails_sent || 0}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact360?.calls_made || 0}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {contact360?.meetings_held || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
