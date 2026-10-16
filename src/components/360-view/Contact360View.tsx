import { useState, useMemo } from 'react';
import type { Contact } from '@/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCRMStore } from '@/stores/crmStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useAuthStore } from '@/stores/authStore';
import { TwilioDialerModal } from '@/components/telephony/TwilioDialerModal';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Linkedin,
  MessageSquare,
  Calendar,
  FileText,
  Euro,
  TrendingUp,
  Clock,
  Edit,
  MoreHorizontal,
  PhoneCall,
  MailOpen,
  Star,
  Plus,
  Send,
  Trash2,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

interface Contact360ViewProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Contact360View({ contactId, isOpen, onClose }: Contact360ViewProps) {
  const { getContact360, deals, activities, updateContact, deleteContact, addActivity, addDeal } = useCRMStore();
  const { getCallsByContact, campaigns } = useContactCenterStore();
  const { user, organization } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  // Form states
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingLocation, setMeetingLocation] = useState('Google Meet / Telefonisch');
  const [meetingNotes, setMeetingNotes] = useState('');

  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'Gespreksnotitie' | 'Opvolging' | 'Interne Memo'>('Gespreksnotitie');

  const [dealName, setDealName] = useState('');
  const [dealValue, setDealValue] = useState('2500');
  const [dealStage, setDealStage] = useState('proposal');

  // Memoized contact data for high-performance rendering
  const contact = useMemo(() => {
    return contactId ? getContact360(contactId) : null;
  }, [contactId, getContact360]);

  // Edit contact form state initialized when contact loads
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<Contact['status']>('lead');
  const [editScore, setEditScore] = useState(70);

  const contactDeals = useMemo(() => {
    return deals.filter((d) => d.contact_id === contactId);
  }, [deals, contactId]);

  const contactActivities = useMemo(() => {
    return activities.filter(
      (a) => a.related_to.type === 'contact' && a.related_to.id === contactId
    );
  }, [activities, contactId]);

  const contactCalls = useMemo(() => {
    return contactId ? getCallsByContact(contactId) : [];
  }, [contactId, getCallsByContact]);

  if (!contact) return null;

  // Open Edit Modal with pre-filled fields
  const handleOpenEdit = () => {
    setEditFirstName(contact.first_name || '');
    setEditLastName(contact.last_name || '');
    setEditEmail(contact.email || '');
    setEditPhone(contact.phone || '');
    setEditCompany(contact.company || '');
    setEditTitle(contact.title || '');
    setEditStatus(contact.status || 'lead');
    setEditScore(contact.score || 70);
    setIsEditModalOpen(true);
  };

  const handleSaveContactEdit = () => {
    if (!contactId) return;
    updateContact(contactId, {
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
      phone: editPhone,
      company: editCompany,
      title: editTitle,
      status: editStatus,
      score: Number(editScore),
    });

    addActivity({
      type: 'task',
      title: `Contactgegevens bijgewerkt voor ${editFirstName} ${editLastName}`,
      description: `Gewijzigd door ${user?.name || 'CRMos Gebruiker'}`,
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_to: user?.id || 'user1',
      related_to: { type: 'contact', id: contactId },
      org_id: organization?.id || 'default_org',
    });

    toast.success('Contactgegevens succesvol bijgewerkt');
    setIsEditModalOpen(false);
  };

  // Add Note handler
  const handleSaveNote = () => {
    if (!noteContent.trim() || !contactId) {
      toast.error('Vul een notitie in');
      return;
    }

    addActivity({
      type: 'note',
      title: `${noteCategory}: ${contact.first_name} ${contact.last_name}`,
      description: noteContent.trim(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_to: user?.id || 'user1',
      related_to: { type: 'contact', id: contactId },
      org_id: organization?.id || 'default_org',
    });

    toast.success('Notitie toegevoegd aan tijdlijn');
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  // Schedule Meeting handler
  const handleSaveMeeting = () => {
    if (!meetingTitle.trim() || !contactId) {
      toast.error('Vul een afspraaktitel in');
      return;
    }

    const scheduledDate = `${meetingDate}T${meetingTime}:00`;

    addActivity({
      type: 'meeting',
      title: meetingTitle,
      description: `Locatie: ${meetingLocation} • Notities: ${meetingNotes || 'Geen extra toelichting'}`,
      status: 'pending',
      due_date: scheduledDate,
      assigned_to: user?.id || 'user1',
      related_to: { type: 'contact', id: contactId },
      org_id: organization?.id || 'default_org',
    });

    toast.success(`Afspraak ingepland op ${format(new Date(scheduledDate), 'dd MMM yyyy HH:mm')}`);
    setMeetingTitle('');
    setMeetingNotes('');
    setIsMeetingModalOpen(false);
  };

  // Send Email handler
  const handleSendEmail = (openNativeClient: boolean = false) => {
    if (!contact.email) {
      toast.error('Geen e-mailadres beschikbaar voor dit contact');
      return;
    }

    if (openNativeClient) {
      const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(
        emailSubject || 'Contact via CRMos'
      )}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
    }

    // Log email activity in CRMos
    if (contactId) {
      addActivity({
        type: 'email',
        title: `E-mail verzonden: ${emailSubject || 'Geen onderwerp'}`,
        description: emailBody || 'Verzonden via gekoppeld e-mailaccount',
        status: 'completed',
        completed_at: new Date().toISOString(),
        assigned_to: user?.id || 'user1',
        related_to: { type: 'contact', id: contactId },
        org_id: organization?.id || 'default_org',
      });
    }

    toast.success(`E-mail gelogd voor ${contact.first_name}`);
    setEmailSubject('');
    setEmailBody('');
    setIsEmailModalOpen(false);
  };

  // Add Deal handler
  const handleSaveNewDeal = () => {
    if (!dealName.trim() || !contactId) {
      toast.error('Vul een dealnaam in');
      return;
    }

    addDeal({
      name: dealName.trim(),
      value: Number(dealValue) || 1000,
      stage: dealStage,
      probability: dealStage === 'proposal' ? 50 : dealStage === 'negotiation' ? 75 : 25,
      contact_id: contactId,
      company_id: contact.company_id || '',
      assigned_to: user?.id || 'user1',
      pipeline_id: '1',
      currency: 'EUR',
      source: 'Direct CRMos',
      tags: [],
      activities: [],
      org_id: organization?.id || 'default_org',
    });

    toast.success(`Deal "${dealName}" gekoppeld aan ${contact.first_name}`);
    setDealName('');
    setIsNewDealModalOpen(false);
  };

  // Delete contact handler
  const handleDelete = () => {
    if (!contactId) return;
    if (window.confirm(`Weet je zeker dat je ${contact.first_name} ${contact.last_name} wilt verwijderen?`)) {
      deleteContact(contactId);
      toast.success('Contact verwijderd');
      onClose();
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'deal_created': return <Euro className="h-4 w-4" />;
      case 'deal_won': return <TrendingUp className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full max-w-2xl overflow-hidden p-0 flex flex-col h-full bg-background">
          {/* Header */}
          <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {contact.first_name[0]}{contact.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {contact.first_name} {contact.last_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {contact.title ? `${contact.title}` : 'Geen functietitel'}
                    {contact.company ? ` bij ${contact.company}` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        contact.status === 'customer'
                          ? 'default'
                          : contact.status === 'prospect'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="capitalize text-xs font-semibold"
                    >
                      {contact.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">{contact.score}</span>
                      <span className="text-[10px]">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit and More */}
              <div className="flex gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenEdit}
                  title="Contact bewerken"
                  className="h-9 w-9 rounded-full shadow-xs hover:bg-muted"
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Meer opties"
                      className="h-9 w-9 rounded-full shadow-xs hover:bg-muted"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem onClick={() => setIsNewDealModalOpen(true)} className="gap-2 cursor-pointer">
                      <Euro className="h-4 w-4 text-emerald-500" />
                      <span>Nieuwe Deal Koppelen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const firstCamp = campaigns[0];
                        if (firstCamp) {
                          toast.success(`Contact gekoppeld aan campagne "${firstCamp.name}"`);
                        } else {
                          toast.info('Geen actieve belcampagnes gevonden in contact center');
                        }
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>Koppel aan Belcampagne</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                      <span>Contact Verwijderen</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Quick Interactive Actions */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEmailModalOpen(true)}
                className="h-10 rounded-xl font-medium shadow-xs hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsDialerOpen(true)}
                className="h-10 rounded-xl font-medium shadow-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Bellen</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsMeetingModalOpen(true)}
                className="h-10 rounded-xl font-medium shadow-xs hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Afspraak</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsNoteModalOpen(true)}
                className="h-10 rounded-xl font-medium shadow-xs hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Notitie</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-5 mt-3 grid grid-cols-5 h-9 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="overview" className="text-xs rounded-lg py-1">Overzicht</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs rounded-lg py-1">Tijdlijn</TabsTrigger>
              <TabsTrigger value="deals" className="text-xs rounded-lg py-1">
                Deals {contactDeals.length > 0 && `(${contactDeals.length})`}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs rounded-lg py-1">
                Activiteit {contactActivities.length > 0 && `(${contactActivities.length})`}
              </TabsTrigger>
              <TabsTrigger value="calls" className="text-xs rounded-lg py-1">
                Oproepen {contactCalls.length > 0 && `(${contactCalls.length})`}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-5 py-4">
              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                {/* Contact Info Card */}
                <Card className="rounded-2xl border-border/60 shadow-xs">
                  <CardHeader className="py-3.5 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Contact Informatie
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenEdit}
                      className="h-7 text-xs px-2 gap-1 text-primary"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Wijzigen</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2.5 truncate">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{contact.email || 'Geen email'}</span>
                      </div>
                      {contact.email && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEmailModalOpen(true)}
                          className="h-7 text-xs px-2 text-primary"
                        >
                          Emailen
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2.5 truncate">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{contact.phone || 'Geen telefoon'}</span>
                      </div>
                      {contact.phone && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsDialerOpen(true)}
                          className="h-7 text-xs px-2 text-emerald-600"
                        >
                          Bellen
                        </Button>
                      )}
                    </div>

                    {contact.company && (
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{contact.company}</span>
                      </div>
                    )}

                    {contact.address?.city && (
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{contact.address.city}, {contact.address.state}</span>
                      </div>
                    )}

                    {contact.social_profiles?.linkedin && (
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <Linkedin className="h-4 w-4 text-blue-600 shrink-0" />
                        <a
                          href={contact.social_profiles.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary"
                        >
                          LinkedIn Profiel
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Engagement Score Card */}
                <Card className="rounded-2xl border-border/60 shadow-xs">
                  <CardHeader className="py-3.5 px-4 border-b border-border/40">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Engagement &amp; Activiteit Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span>Totale Relatiescore</span>
                        <span className="font-bold text-foreground">{contact.score}/100</span>
                      </div>
                      <Progress value={contact.score} className="h-2 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <MailOpen className="h-5 w-5 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-base font-bold text-foreground">{contact.emails_sent || 0}</p>
                          <p className="text-[11px] text-muted-foreground">Emails verzonden</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <PhoneCall className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-base font-bold text-foreground">{contactCalls.length || contact.calls_made || 0}</p>
                          <p className="text-[11px] text-muted-foreground">Oproepen</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <Calendar className="h-5 w-5 text-purple-500 shrink-0" />
                        <div>
                          <p className="text-base font-bold text-foreground">{contact.meetings_held || 0}</p>
                          <p className="text-[11px] text-muted-foreground">Afspraken</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <Euro className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-base font-bold text-foreground">
                            €{(contact.lifetime_value || 0).toLocaleString('nl-NL')}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Totale Waarde</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <Card className="rounded-2xl border-border/60 shadow-xs">
                    <CardHeader className="py-3 px-4 border-b border-border/40">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Labels &amp; Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-wrap gap-1.5">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-md text-xs font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB 2: TIMELINE */}
              <TabsContent value="timeline" className="mt-0 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Interactie Historie
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsNoteModalOpen(true)}
                      className="h-7 text-xs rounded-lg gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Notitie toevoegen</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  {contact.timeline && contact.timeline.length > 0 ? (
                    contact.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs shrink-0">
                            {getTimelineIcon(event.type)}
                          </div>
                          <div className="mt-2 h-full w-px bg-border/60" />
                        </div>
                        <div className="flex-1 pb-5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-xs sm:text-sm text-foreground">{event.title}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
                          {event.user_name && (
                            <p className="mt-1 text-[10px] text-muted-foreground/80">
                              Door {event.user_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-xs text-muted-foreground">Nog geen activiteiten vastgelegd voor dit contact.</p>
                      <Button
                        size="sm"
                        onClick={() => setIsNoteModalOpen(true)}
                        className="rounded-full text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Eerste notitie toevoegen</span>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: DEALS */}
              <TabsContent value="deals" className="mt-0 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verkoopkansen &amp; Deals
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsNewDealModalOpen(true)}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nieuwe Deal</span>
                  </Button>
                </div>

                {contactDeals.map((deal) => (
                  <Card key={deal.id} className="rounded-xl border-border/60 shadow-xs">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">{deal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            €{deal.value.toLocaleString('nl-NL')} • {deal.probability}% sluitingskans
                          </p>
                        </div>
                        <Badge
                          variant={
                            deal.stage === 'closed-won' || deal.stage === 'won'
                              ? 'default'
                              : 'outline'
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {deal.stage}
                        </Badge>
                      </div>
                      {deal.expected_close_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Verwachte sluitdatum: {format(new Date(deal.expected_close_date), 'd MMM yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {contactDeals.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-xs text-muted-foreground">Geen gekoppelde deals gevonden.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsNewDealModalOpen(true)}
                      className="rounded-full text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Deal aanmaken</span>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: ACTIVITY */}
              <TabsContent value="activity" className="mt-0 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Openstaande &amp; Voltooide Taken
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsNoteModalOpen(true)}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nieuwe Taak</span>
                  </Button>
                </div>

                {contactActivities.map((activity) => (
                  <Card key={activity.id} className="rounded-xl border-border/60 shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2.5 shrink-0 ${
                            activity.type === 'call'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : activity.type === 'email'
                              ? 'bg-blue-500/10 text-blue-600'
                              : activity.type === 'meeting'
                              ? 'bg-purple-500/10 text-purple-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {activity.type === 'call' && <Phone className="h-4 w-4" />}
                          {activity.type === 'email' && <Mail className="h-4 w-4" />}
                          {activity.type === 'meeting' && <Calendar className="h-4 w-4" />}
                          {activity.type === 'task' && <Clock className="h-4 w-4" />}
                          {activity.type === 'note' && <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                          {activity.due_date && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Deadline: {format(new Date(activity.due_date), 'd MMM yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={activity.status === 'completed' ? 'default' : 'outline'}
                        className="text-[10px] uppercase font-semibold shrink-0"
                      >
                        {activity.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}

                {contactActivities.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-xs text-muted-foreground">Geen openstaande taken voor dit contact.</p>
                  </div>
                )}
              </TabsContent>

              {/* TAB 5: CALLS */}
              <TabsContent value="calls" className="mt-0 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Telefonieregistraties &amp; Twilio Calls
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsDialerOpen(true)}
                    className="h-7 text-xs rounded-lg gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>Oproep Starten</span>
                  </Button>
                </div>

                {contactCalls.map((call) => (
                  <Card key={call.id} className="rounded-xl border-border/60 shadow-xs">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-full p-2.5 ${
                              call.direction === 'inbound'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-foreground">
                              {call.direction === 'inbound' ? 'Inkomende Oproep' : 'Uitgaande Oproep'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {call.duration
                                ? `Duur: ${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`
                                : 'Gemiste oproep'}
                              {call.started_at && ` • ${formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={call.status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize text-[10px] font-semibold"
                        >
                          {call.disposition || call.status}
                        </Badge>
                      </div>

                      {call.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40">
                          {call.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {contactCalls.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-xs text-muted-foreground">Geen geregistreerde oproepen gevonden.</p>
                    <Button
                      size="sm"
                      onClick={() => setIsDialerOpen(true)}
                      className="rounded-full text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>Direct bellen via Twilio / GSM</span>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* 1. TWILIO & GSM CALL MODAL */}
      <TwilioDialerModal
        isOpen={isDialerOpen}
        onClose={() => setIsDialerOpen(false)}
        contact={contact}
      />

      {/* 2. EMAIL COMPOSER MODAL */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>E-mail sturen naar {contact.first_name} {contact.last_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Aan</Label>
              <Input value={contact.email || ''} disabled className="bg-muted/50 text-xs h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Onderwerp</Label>
              <Input
                placeholder="Bijv. Opvolging introductiegesprek CRMos..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bericht</Label>
              <Textarea
                placeholder="Beste, hierbij de afgesproken informatie..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[120px] text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendEmail(true)}
              className="w-full sm:w-auto rounded-xl text-xs gap-1"
            >
              <Send className="h-3 w-3" />
              <span>Open in Mail App</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleSendEmail(false)}
              className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verstuur &amp; Log in Tijdlijn</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MEETING SCHEDULER MODAL */}
      <Dialog open={isMeetingModalOpen} onOpenChange={setIsMeetingModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>Afspraak plannen met {contact.first_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Onderwerp / Titel</Label>
              <Input
                placeholder="Demo CRMos / Offerte bespreking"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Datum</Label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tijd</Label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Locatie / Kanaal</Label>
              <Input
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Agenda Notities</Label>
              <Textarea
                placeholder="Voorbereidende punten..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="min-h-[80px] text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMeetingModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMeeting}
              className="rounded-xl text-xs font-semibold gap-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Afspraak Bevestigen</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. NOTE MODAL */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              <span>Notitie toevoegen voor {contact.first_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Categorie</Label>
              <div className="flex gap-2">
                {(['Gespreksnotitie', 'Opvolging', 'Interne Memo'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNoteCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      noteCategory === cat
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-semibold'
                        : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notitie Inhoud</Label>
              <Textarea
                placeholder="Noteer details van klantcontact, feedback of taken..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[110px] text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNote}
              className="rounded-xl text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Notitie Opslaan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. EDIT CONTACT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              <span>Contactpersoon Bewerken</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Voornaam</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Achternaam</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Telefoon</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bedrijf</Label>
                <Input
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Functietitel</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Contact['status'])}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Klant</option>
                  <option value="churned">Inactief / Churned</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Lead Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editScore}
                  onChange={(e) => setEditScore(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={handleSaveContactEdit}
              className="rounded-xl text-xs font-semibold gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Wijzigingen Opslaan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. NEW DEAL MODAL */}
      <Dialog open={isNewDealModalOpen} onOpenChange={setIsNewDealModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Euro className="h-4 w-4 text-emerald-500" />
              <span>Nieuwe Deal koppelen aan {contact.first_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dealnaam</Label>
              <Input
                placeholder="Bijv. Jaarcontract CRMos Enterprise..."
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Verwachte Waarde (€)</Label>
                <Input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fase</Label>
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Gekwalificeerd</option>
                  <option value="proposal">Voorstel / Offerte</option>
                  <option value="negotiation">Onderhandeling</option>
                  <option value="closed-won">Gewonnen (Closed-Won)</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewDealModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNewDeal}
              className="rounded-xl text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Deal Opslaan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
