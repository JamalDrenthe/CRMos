import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useCRMStore } from '@/stores/crmStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Linkedin,
  MessageSquare,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Edit,
  MoreHorizontal,
  PhoneCall,
  MailOpen,
  Star,
} from 'lucide-react';

interface Contact360ViewProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Contact360View({ contactId, isOpen, onClose }: Contact360ViewProps) {
  const { getContact360, deals, activities } = useCRMStore();
  const { getCallsByContact } = useContactCenterStore();
  const [activeTab, setActiveTab] = useState('overview');

  const contact = contactId ? getContact360(contactId) : null;
  const contactDeals = deals.filter((d) => d.contact_id === contactId);
  const contactActivities = activities.filter(
    (a) => a.related_to.type === 'contact' && a.related_to.id === contactId
  );
  const contactCalls = contactId ? getCallsByContact(contactId) : [];

  if (!contact) return null;

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'deal_created': return <DollarSign className="h-4 w-4" />;
      case 'deal_won': return <TrendingUp className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-2xl overflow-hidden p-0">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-background">
                <AvatarImage src={contact.avatar} />
                <AvatarFallback className="text-xl">
                  {contact.first_name[0]}{contact.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {contact.first_name} {contact.last_name}
                </h2>
                <p className="text-muted-foreground">{contact.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={contact.status === 'customer' ? 'default' : 'secondary'}>
                    {contact.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{contact.score}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-2">
            <Button size="sm" variant="secondary">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button size="sm" variant="secondary">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            <Button size="sm" variant="secondary">
              <Calendar className="mr-2 h-4 w-4" />
              Meeting
            </Button>
            <Button size="sm" variant="secondary">
              <FileText className="mr-2 h-4 w-4" />
              Note
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-[calc(100vh-280px)] flex-col">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  {contact.address?.city && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {contact.address.city}, {contact.address.state}
                      </span>
                    </div>
                  )}
                  {contact.social_profiles?.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a href={contact.social_profiles.linkedin} className="hover:underline" target="_blank" rel="noopener noreferrer">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium">{contact.score}/100</span>
                      </div>
                      <Progress value={contact.score} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <MailOpen className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{contact.emails_sent}</p>
                          <p className="text-xs text-muted-foreground">Emails Sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PhoneCall className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{contact.calls_made}</p>
                          <p className="text-xs text-muted-foreground">Calls Made</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">{contact.meetings_held}</p>
                          <p className="text-xs text-muted-foreground">Meetings</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">${contact.lifetime_value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Lifetime Value</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="space-y-4">
                {contact.timeline?.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="mt-2 h-full w-px bg-border" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{event.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      {event.user_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          by {event.user_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deals" className="mt-0">
              <div className="space-y-3">
                {contactDeals.map((deal) => (
                  <Card key={deal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{deal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${deal.value.toLocaleString()} • {deal.probability}% probability
                          </p>
                        </div>
                        <Badge variant={deal.stage === 'closed-won' ? 'default' : 'outline'}>
                          {deal.stage}
                        </Badge>
                      </div>
                      {deal.expected_close_date && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Expected close: {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {contactDeals.length === 0 && (
                  <p className="text-center text-muted-foreground">No deals associated</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="space-y-3">
                {contactActivities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${
                            activity.type === 'call' ? 'bg-blue-500/10 text-blue-500' :
                            activity.type === 'email' ? 'bg-green-500/10 text-green-500' :
                            activity.type === 'meeting' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {activity.type === 'call' && <Phone className="h-4 w-4" />}
                            {activity.type === 'email' && <Mail className="h-4 w-4" />}
                            {activity.type === 'meeting' && <Calendar className="h-4 w-4" />}
                            {activity.type === 'task' && <Clock className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                        </div>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                          {activity.status}
                        </Badge>
                      </div>
                      {activity.due_date && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Due: {format(new Date(activity.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {contactActivities.length === 0 && (
                  <p className="text-center text-muted-foreground">No activities</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="calls" className="mt-0">
              <div className="space-y-3">
                {contactCalls.map((call) => (
                  <Card key={call.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${
                            call.direction === 'inbound' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : 'Missed'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                          {call.status}
                        </Badge>
                      </div>
                      {call.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{call.notes}</p>
                      )}
                      {call.disposition && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Disposition: {call.disposition}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {contactCalls.length === 0 && (
                  <p className="text-center text-muted-foreground">No call history</p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
