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
import { getVvcTag } from '@/services/vvcTagService';
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
  Tag,
  Copy,
  Hash,
  UserPlus,
  X,
  Users,
  ShieldCheck,
  Sparkles,
  Crown,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCompanyTag } from '@/lib/companyAccess';
import { isReferredByJamal } from '@/services/crmSearchEngine';

interface Contact360ViewProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Contact360View({ contactId, isOpen, onClose }: Contact360ViewProps) {
  const {
    getContact360,
    companies,
    teams,
    deals,
    activities,
    updateContact,
    deleteContact,
    addActivity,
    addDeal,
    addTagToContact,
    removeTagFromContact,
    addCompanyTagToContact,
    removeCompanyTagFromContact,
    inviteContactToCompany,
    assignContactToTeam,
    setContactTeamStatus,
    setContactReferrer,
    startTeamForContact,
    requestTeamForContact,
    approveTeamRequest,
    rejectTeamRequest,
  } = useCRMStore();
  const { getCallsByContact, campaigns } = useContactCenterStore();
  const { user, organization } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [newTagInput, setNewTagInput] = useState('');
  const [newCompanyTagInput, setNewCompanyTagInput] = useState('');
  const [selectedInviteCompanyId, setSelectedInviteCompanyId] = useState('');
  const [customTeamNameInput, setCustomTeamNameInput] = useState('');
  const [referrerInput, setReferrerInput] = useState('');

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

  const vvcTag = useMemo(() => {
    return contact ? getVvcTag(contact) : undefined;
  }, [contact]);

  // Edit contact form state initialized when contact loads
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<Contact['status']>('lead');
  const [editScore, setEditScore] = useState(70);
  const [editTeamId, setEditTeamId] = useState('team_jamal_drenthe');
  const [editTeamStatus, setEditTeamStatus] = useState<'active' | 'passive'>('active');
  const [editReferrer, setEditReferrer] = useState('Jamal Drenthe');
  const [editSource, setEditSource] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCity, setEditCity] = useState('');

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

  const isJamalReferred = contact.can_start_team || isReferredByJamal(contact.referred_by_name);
  const effectiveTeamStatus = contact.team_status || 'active';
  const effectiveTeamName = contact.team_name || 'Team Jamal Drenthe';
  const effectiveReferrer = contact.referred_by_name || 'Jamal Drenthe';

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
    setEditTeamId(contact.team_id || 'team_jamal_drenthe');
    setEditTeamStatus(contact.team_status || 'active');
    setEditReferrer(contact.referred_by_name || 'Jamal Drenthe');
    setEditSource(contact.source || 'Referral / Recruit');
    setEditNotes(contact.notes || '');
    setEditCity(contact.address?.city || '');
    setIsEditModalOpen(true);
  };

  const handleSaveContactEdit = () => {
    if (!contactId) return;
    const selectedTeam = teams.find((t) => t.id === editTeamId);
    const jamalRef = isReferredByJamal(editReferrer);
    updateContact(contactId, {
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
      phone: editPhone,
      company: editCompany,
      title: editTitle,
      status: editStatus,
      score: Number(editScore),
      team_id: editTeamId,
      team_name: selectedTeam ? selectedTeam.name : contact.team_name || 'Team Jamal Drenthe',
      team_status: editTeamStatus,
      referred_by_name: editReferrer.trim() || 'Jamal Drenthe',
      can_start_team: jamalRef || contact.team_request_status === 'approved',
      source: editSource.trim() || 'Referral / Recruit',
      notes: editNotes.trim(),
      address: {
        ...(contact.address || {}),
        city: editCity.trim(),
      },
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
                    {(contact.first_name || 'C')[0]}{(contact.last_name || contact.first_name?.slice(1) || 'R')[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {contact.first_name} {contact.last_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {contact.title ? `${contact.title}` : 'Team Member / Recruit'}
                    {contact.company ? ` bij ${contact.company}` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
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

                    {/* Team & Actief/Passief Badge in Header */}
                    <Badge
                      variant="outline"
                      className={
                        effectiveTeamStatus === 'active'
                          ? 'text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1'
                          : 'text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30 flex items-center gap-1'
                      }
                    >
                      <Users className="h-3 w-3" />
                      <span>{effectiveTeamName}</span>
                      <span className="opacity-70">•</span>
                      <span>{effectiveTeamStatus === 'active' ? 'Actief Team' : 'Passief Team'}</span>
                    </Badge>

                    {/* Jamal Drenthe Referral / Teamleider Badge */}
                    {isJamalReferred && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 flex items-center gap-1"
                      >
                        <Crown className="h-3 w-3 text-violet-500" />
                        <span>Via Jamal Drenthe • Mag Team Starten</span>
                      </Badge>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">{contact.score}</span>
                      <span className="text-[10px]">/ 100</span>
                    </div>

                    {vvcTag && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(vvcTag);
                          toast.success(`VVC tag gekopieerd: ${vvcTag}`);
                        }}
                        title="Klik om unieke VVC communicatie tag te kopiëren"
                        className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full hover:bg-amber-500/20 transition-colors cursor-pointer group"
                      >
                        <Tag className="h-3 w-3 text-amber-500" />
                        <span>{vvcTag}</span>
                        <Copy className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
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
                {/* 1. VOLLEDIGE TAGS & ZELF TAGS TOEVOEGEN CARD (Top priority so tags are always visible and editable everywhere) */}
                <Card className="rounded-2xl border-primary/25 bg-primary/[0.02] shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Alle Tags &amp; Zelf Tags Toevoegen
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {Array.from(new Set([vvcTag || `vvc-${contact.id}`, ...(contact.tags || []), ...(contact.company_tags || [])])).length} tags
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    {/* Bestaande tags met verwijder-knop */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from(
                        new Set([
                          vvcTag || `vvc-${contact.id}`,
                          ...(contact.company_tags || []),
                          ...(contact.tags || []),
                        ])
                      )
                        .filter(Boolean)
                        .map((tag) => {
                          const isVvc = tag.toLowerCase().startsWith('vvc-');
                          const isComp = tag.startsWith('#');
                          return (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={
                                isVvc
                                  ? 'text-[11px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 py-0.5 px-2 flex items-center gap-1'
                                  : isComp
                                  ? 'text-[11px] font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 py-0.5 px-2 flex items-center gap-1'
                                  : 'text-[11px] bg-background border-border py-0.5 px-2 flex items-center gap-1'
                              }
                            >
                              <span>{tag}</span>
                              {!isVvc && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeTagFromContact(contact.id, tag);
                                    toast.info(`Tag "${tag}" verwijderd van ${contact.first_name}`);
                                  }}
                                  title="Tag verwijderen"
                                  className="hover:text-red-500 ml-0.5"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </Badge>
                          );
                        })}
                    </div>

                    {/* Zelf nieuwe tag toevoegen */}
                    <div className="flex gap-1.5">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            e.preventDefault();
                            addTagToContact(contact.id, newTagInput.trim());
                            toast.success(`Tag "${newTagInput.trim()}" toegevoegd aan ${contact.first_name}`);
                            setNewTagInput('');
                          }
                        }}
                        placeholder="Typ een nieuwe tag (bijv. Closer, Salesmates, #vvc, VIP)..."
                        className="h-8 text-xs rounded-xl bg-background"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newTagInput.trim()) return;
                          addTagToContact(contact.id, newTagInput.trim());
                          toast.success(`Tag "${newTagInput.trim()}" toegevoegd aan ${contact.first_name}`);
                          setNewTagInput('');
                        }}
                        className="h-8 rounded-xl text-xs px-3 gap-1 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tag Toevoegen</span>
                      </Button>
                    </div>

                    {/* Snel-tags om met 1 klik toe te voegen */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-muted-foreground mr-1">Snel toevoegen:</span>
                      {[
                        'Salesmates',
                        'Actief Team',
                        'Passief Team',
                        'Teamleider',
                        'Top Recruit',
                        'Closer',
                        'Door Jamal Drenthe',
                        '#vvc',
                        '#spontiva',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            addTagToContact(contact.id, preset);
                            toast.success(`Tag "${preset}" toegevoegd`);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md border border-border/60 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. TEAM & REFERRAL INDELING CARD (Actief/Passief Team + Jamal Drenthe Team-Recht) */}
                <Card className="rounded-2xl border-violet-500/30 bg-violet-500/[0.03] shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-violet-500/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                        Team &amp; Referral Indeling
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        effectiveTeamStatus === 'active'
                          ? 'text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'text-[10px] bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30'
                      }
                    >
                      {effectiveTeamStatus === 'active' ? '● Actief Team' : '○ Passief Team'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    {/* Huidig Team & Actief/Passief Schakelaar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">Ingedeeld in Team</Label>
                        <select
                          value={contact.team_id || 'team_jamal_drenthe'}
                          onChange={(e) => {
                            const chosen = teams.find((t) => t.id === e.target.value);
                            if (chosen) {
                              assignContactToTeam(contact.id, chosen.id, chosen.status);
                              toast.success(`${contact.first_name} ingedeeld in ${chosen.name}`);
                            }
                          }}
                          className="w-full h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                        >
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.status === 'active' ? 'Actief' : 'Passief'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">Team Status (Actief / Passief)</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setContactTeamStatus(contact.id, 'active');
                              toast.success(`${contact.first_name} staat nu op Actief Team`);
                            }}
                            className={`h-8 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                              effectiveTeamStatus === 'active'
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Actief Team</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setContactTeamStatus(contact.id, 'passive');
                              toast.info(`${contact.first_name} staat nu op Passief Team`);
                            }}
                            className={`h-8 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                              effectiveTeamStatus === 'passive'
                                ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>Passief Team</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Aangeleverd door (Referrer / Recruiter) */}
                    <div className="p-2.5 rounded-xl bg-background border border-border/60 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                          <span className="text-[11px] font-semibold text-foreground">
                            Aangeleverd door (Referral / Recruit):
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isJamalReferred
                              ? 'text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 font-semibold'
                              : 'text-[10px] bg-muted text-foreground'
                          }
                        >
                          {effectiveReferrer}
                        </Badge>
                      </div>

                      <div className="flex gap-1.5">
                        <Input
                          value={referrerInput}
                          onChange={(e) => setReferrerInput(e.target.value)}
                          placeholder={`Wijzig aanbrenger (huidig: ${effectiveReferrer})...`}
                          className="h-7 text-xs rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const nextRef = referrerInput.trim() || 'Jamal Drenthe';
                            setContactReferrer(contact.id, nextRef);
                            setReferrerInput('');
                            toast.success(`Aanbrenger bijgewerkt naar ${nextRef}`);
                          }}
                          className="h-7 text-[11px] px-2.5 rounded-lg shrink-0"
                        >
                          Opslaan
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-muted-foreground mr-1">Kies direct:</span>
                        {['Jamal Drenthe', 'Reyhan', 'Julius', 'Jayden', 'Deniz', 'Boas', 'Fawzan', 'Ricardo'].map(
                          (leader) => (
                            <button
                              key={leader}
                              type="button"
                              onClick={() => {
                                setContactReferrer(contact.id, leader);
                                toast.success(`${contact.first_name} gemarkeerd als aangeleverd door ${leader}`);
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                                effectiveReferrer.toLowerCase().includes(leader.toLowerCase())
                                  ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                                  : 'border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground'
                              }`}
                            >
                              {leader}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Eigen Team Starten (Jamal Drenthe recht) vs Team Aanvragen */}
                    <div
                      className={`p-3 rounded-xl border space-y-2.5 ${
                        isJamalReferred
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      {isJamalReferred ? (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                  Direct Team-Recht (Aangeleverd door Jamal Drenthe)
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Deze persoon is door Jamal Drenthe aangeleverd en kan direct een eigen team starten.
                                </p>
                              </div>
                            </div>
                            {contact.team_role === 'leader' && (
                              <Badge className="bg-emerald-600 text-white text-[10px] shrink-0">
                                Teamleider
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <Input
                              value={customTeamNameInput}
                              onChange={(e) => setCustomTeamNameInput(e.target.value)}
                              placeholder={contact.own_team_name || `Team ${contact.first_name}`}
                              className="h-8 text-xs rounded-xl bg-background"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const teamTitle = customTeamNameInput.trim() || `Team ${contact.first_name}`;
                                const created = startTeamForContact(
                                  contact.id,
                                  teamTitle,
                                  contact.team_status || 'active'
                                );
                                if (created.success) {
                                  setCustomTeamNameInput('');
                                  toast.success(`${contact.first_name} is nu Teamleider van "${created.team?.name || teamTitle}"!`);
                                }
                              }}
                              className="h-8 rounded-xl text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0"
                            >
                              <Crown className="h-3.5 w-3.5" />
                              <span>{contact.team_role === 'leader' ? 'Team Hernoemen / Activeren' : 'Team Starten'}</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                  Team Starten op Aanvraag (Niet direct door Jamal Drenthe aangeleverd)
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Alleen personen aangeleverd door Jamal Drenthe kunnen direct een team starten. De rest vraagt het hier aan.
                                </p>
                              </div>
                            </div>
                            {contact.team_request_status === 'pending' && (
                              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700 dark:text-amber-300 shrink-0">
                                Aanvraag Open
                              </Badge>
                            )}
                          </div>

                          {contact.team_request_status === 'pending' ? (
                            <div className="flex items-center justify-between gap-2 pt-1 bg-background p-2.5 rounded-xl border border-amber-500/30">
                              <div className="text-xs">
                                <span className="font-semibold">Aangevraagd team: </span>
                                <span className="text-amber-700 dark:text-amber-400 font-bold">
                                  {contact.team_request_name || `Team ${contact.first_name}`}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const created = approveTeamRequest(contact.id);
                                    if (created) {
                                      toast.success(`Teamaanvraag goedgekeurd! "${created.name}" is gestart.`);
                                    }
                                  }}
                                  className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Goedkeuren
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    rejectTeamRequest(contact.id);
                                    toast.info('Teamaanvraag afgewezen');
                                  }}
                                  className="h-7 text-[11px] px-2.5 rounded-lg text-destructive"
                                >
                                  Afwijzen
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 pt-1">
                              <Input
                                value={customTeamNameInput}
                                onChange={(e) => setCustomTeamNameInput(e.target.value)}
                                placeholder={`Gewenste teamnaam (bijv. Team ${contact.first_name})`}
                                className="h-8 text-xs rounded-xl bg-background"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  const reqName = customTeamNameInput.trim() || `Team ${contact.first_name}`;
                                  requestTeamForContact(contact.id, reqName);
                                  setCustomTeamNameInput('');
                                  toast.success(`Teamaanvraag "${reqName}" ingediend voor goedkeuring!`);
                                }}
                                className="h-8 rounded-xl text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white gap-1 shrink-0"
                              >
                                <Users className="h-3.5 w-3.5" />
                                <span>Team Aanvragen</span>
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 3. VOLLEDIGE CONTACT INFORMATIE CARD */}
                <Card className="rounded-2xl border-border/60 shadow-xs">
                  <CardHeader className="py-3.5 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Volledige Contactgegevens
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
                  <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-muted/30">
                        <span className="text-[10px] uppercase text-muted-foreground block">Volledige Naam</span>
                        <span className="font-semibold text-foreground">
                          {contact.first_name} {contact.last_name}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30">
                        <span className="text-[10px] uppercase text-muted-foreground block">CRM Contact ID</span>
                        <span className="font-mono text-xs text-foreground">{contact.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2.5 truncate">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">E-mailadres</span>
                          <span className="truncate font-medium">{contact.email || 'Geen e-mailadres ingevuld'}</span>
                        </div>
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

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2.5 truncate">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">Telefoon / Mobiel</span>
                          <span className="truncate font-medium">
                            {contact.phone || contact.mobile || 'Geen telefoonnummer'}
                          </span>
                        </div>
                      </div>
                      {(contact.phone || contact.mobile) && (
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

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">Bedrijf</span>
                          <span className="font-medium">{contact.company || 'VVC / Salesmates'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">Functie / Rol</span>
                          <span className="font-medium">{contact.title || 'Team Member'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">Locatie / Adres</span>
                          <span className="font-medium">
                            {contact.address?.city
                              ? `${contact.address.street ? `${contact.address.street}, ` : ''}${contact.address.city}${
                                  contact.address.country ? `, ${contact.address.country}` : ''
                                }`
                              : 'Nederland'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground block">Bron &amp; Aanmelding</span>
                          <span className="font-medium">{contact.source || 'Referral / Recruit'}</span>
                        </div>
                      </div>
                    </div>

                    {contact.notes && (
                      <div className="p-2.5 rounded-xl bg-muted/30">
                        <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Notities / Dossier</span>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{contact.notes}</p>
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

                {/* VVC API Ecosystem Card */}
                <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-amber-500/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        VVC API Communicatie
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background border-amber-500/30 text-amber-700 dark:text-amber-400">
                      Verdienende Vrienden Netwerk
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Dit contact is via de CRMos REST API gekoppeld aan het VVC ecosysteem. Met deze unieke communicatietag worden transacties, commissies en referrals synchroon verwerkt.
                    </p>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background border border-amber-500/25">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
                        <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{vvcTag || 'Geen unieke tag ingesteld'}</span>
                      </div>
                      {vvcTag && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(vvcTag);
                            toast.success(`VVC tag gekopieerd: ${vvcTag}`);
                          }}
                          className="h-7 text-xs px-2.5 gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Kopieer Tag</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span className="font-mono text-[10px]">GET /v1/contacts?tag={vvcTag || 'vvc-id'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Actief Verbonden</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Bedrijfstags & Uitnodigen bij Bedrijf Card */}
                <Card className="rounded-2xl border-sky-500/30 bg-sky-500/[0.04] shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-sky-500/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-sky-500" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        Bedrijfstags &amp; Medewerker Uitnodigen
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background border-sky-500/30 text-sky-600 dark:text-sky-400">
                      Vindbaar op tag
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from(
                        new Set([
                          ...(contact.company_tags || []),
                          ...(contact.tags || []).filter((t) => t.startsWith('#')),
                        ])
                      ).map((ct) => (
                        <Badge
                          key={ct}
                          variant="outline"
                          className="font-mono text-[11px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 py-0.5 px-2 flex items-center gap-1"
                        >
                          <span>{ct}</span>
                          <button
                            type="button"
                            onClick={() => {
                              removeCompanyTagFromContact(contact.id, ct);
                              toast.info(`Bedrijfstag ${ct} verwijderd`);
                            }}
                            className="hover:text-red-500"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <Input
                        value={newCompanyTagInput}
                        onChange={(e) => setNewCompanyTagInput(e.target.value)}
                        placeholder="Voeg bedrijfstag toe (bijv. #spontiva, #vvc)..."
                        className="h-8 text-xs rounded-xl"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!newCompanyTagInput.trim()) return;
                          const formatted = formatCompanyTag(newCompanyTagInput);
                          addCompanyTagToContact(contact.id, formatted);
                          setNewCompanyTagInput('');
                          toast.success(`Bedrijfstag ${formatted} toegevoegd aan ${contact.first_name}`);
                        }}
                        className="h-8 rounded-xl text-xs px-3 border-sky-500/30 text-sky-600 dark:text-sky-400"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tag
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-sky-500/20 flex items-center gap-1.5">
                      <select
                        value={selectedInviteCompanyId || companies[0]?.id || ''}
                        onChange={(e) => setSelectedInviteCompanyId(e.target.value)}
                        className="flex-1 h-8 rounded-xl border border-input bg-background px-2.5 text-xs"
                      >
                        {companies.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name} ({comp.company_tag || formatCompanyTag(comp.name)})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={() => {
                          const targetCompanyId = selectedInviteCompanyId || companies[0]?.id;
                          if (!targetCompanyId) return;
                          const inv = inviteContactToCompany(targetCompanyId, contact.id, 'Medewerker');
                          if (inv) {
                            toast.success(
                              `${contact.first_name} ${contact.last_name} uitgenodigd voor ${inv.company_name} (${inv.company_tag})!`
                            );
                          }
                        }}
                        className="h-8 rounded-xl text-xs px-3 bg-sky-600 hover:bg-sky-700 text-white gap-1 shrink-0"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Uitnodigen</span>
                      </Button>
                    </div>
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
                  <option value="partner">Partner / Teamleider</option>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Team Indeling</Label>
                <select
                  value={editTeamId}
                  onChange={(e) => setEditTeamId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Team Status (Actief / Passief)</Label>
                <select
                  value={editTeamStatus}
                  onChange={(e) => setEditTeamStatus(e.target.value as 'active' | 'passive')}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="active">Actief Team</option>
                  <option value="passive">Passief Team</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Aangeleverd door (Referrer / Recruiter)</Label>
                <Input
                  value={editReferrer}
                  onChange={(e) => setEditReferrer(e.target.value)}
                  placeholder="Bijv. Jamal Drenthe, Reyhan, Julius..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Woonplaats / Regio</Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Bijv. Amsterdam, Rotterdam..."
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notities / Dossier</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notities over dit contact, teamrol of afspraken..."
                className="min-h-[70px] text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <span>Standaard VVC API Tag (gekoppeld aan dit Contact)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={vvcTag || `vvc-${contact.id}`}
                  readOnly
                  className="text-xs h-9 font-mono bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const tagToCopy = vvcTag || `vvc-${contact.id}`;
                    navigator.clipboard.writeText(tagToCopy);
                    toast.success(`VVC tag gekopieerd: ${tagToCopy}`);
                  }}
                  className="h-9 px-3 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0 gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Kopieer</span>
                </Button>
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
