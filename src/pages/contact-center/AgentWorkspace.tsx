import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useCRMStore } from '@/stores/crmStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { useAuthStore } from '@/stores/authStore';
import { Contact360View } from '@/components/360-view/Contact360View';
import { smartSearchContacts } from '@/services/crmSearchEngine';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  Tag,
  Plus,
  Users,
  Eye,
} from 'lucide-react';

const pitchSteps = [
  { id: 1, title: 'Introduction', content: 'Hi [Name], this is [Agent] from CRMos. How are you today?' },
  { id: 2, title: 'Discovery', content: 'I\'m calling because I noticed your company is growing rapidly. Are you currently using a CRM system?' },
  { id: 3, title: 'Value Proposition', content: 'CRMos helps companies like yours increase sales productivity by 40% on average.' },
  { id: 4, title: 'Demo Offer', content: 'I\'d love to show you how it works. Are you available for a quick 15-minute demo this week?' },
  { id: 5, title: 'Close', content: 'Great! I\'ll send you a calendar invite. What\'s the best email to reach you?' },
];

export function AgentWorkspace() {
  const { activeCall, setActiveCall, endCall, todayStats, toggleMute, togglePause, isMuted, isPaused } = useContactCenterStore();
  const { contacts, addActivity, addTagToContact } = useCRMStore();
  const { addPoints } = useEnhancedStore();
  const { user, organization } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [callRating, setCallRating] = useState(0);
  const [showDisposition, setShowDisposition] = useState(false);
  const [notes, setNotes] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState('');

  // Simulate active call timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleStartCall = useCallback((target?: typeof contacts[0]) => {
    if (!contacts || contacts.length === 0) {
      toast.error('Geen contacten beschikbaar in het CRM. Voeg eerst contacten toe om te kunnen bellen.');
      return;
    }
    const chosenContact = target || contacts[Math.floor(Math.random() * contacts.length)];
    const activeUserId = user?.id || 'user1';
    const activeUserName = user?.name || 'Agent';

    setActiveCall({
      id: 'call-' + Date.now(),
      direction: 'outbound',
      from_number: '+31208941200',
      to_number: chosenContact.phone || chosenContact.mobile || '+31612345678',
      contact_id: chosenContact.id,
      contact_name: `${chosenContact.first_name} ${chosenContact.last_name}`,
      status: 'in-progress',
      agent_id: activeUserId,
      agent_name: activeUserName,
      campaign_id: '1',
      started_at: new Date().toISOString(),
    });
    setCallDuration(0);
    setCurrentStep(0);
    setShowDisposition(false);
    setNotes('');
    toast.success(`Gesprek gestart met ${chosenContact.first_name} ${chosenContact.last_name} (Druk op W om af te ronden)`);
  }, [contacts, setActiveCall, user]);

  const handleEndCall = useCallback(() => {
    setShowDisposition(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (!activeCall) handleStartCall();
      }
      if (e.key === 'w' || e.key === 'W') {
        if (activeCall) handleEndCall();
      }
      if (e.key === 'm' || e.key === 'M') {
        if (activeCall) toggleMute();
      }
      if (e.key === 'p' || e.key === 'P') {
        if (activeCall) togglePause();
      }
      if (e.key >= '1' && e.key <= '5' && showDisposition) {
        setCallRating(parseInt(e.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCall, handleEndCall, handleStartCall, showDisposition, toggleMute, togglePause]);

  const handleDisposition = (disposition: string) => {
    if (activeCall) {
      const activeUserId = user?.id || 'user1';
      endCall(activeCall.id, notes, disposition, callRating);

      // Auto-log direct in CRM activities
      addActivity({
        type: 'call',
        title: `Outbound Call (${disposition}): ${activeCall.contact_name}`,
        description: notes || `Gespreksduur: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s. Beoordeling: ${callRating || '-'}/5 sterren.`,
        related_to: {
          type: 'contact',
          id: activeCall.contact_id || 'general',
        },
        status: 'completed',
        due_date: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        assigned_to: activeUserId,
        org_id: organization?.id || 'default_org',
        company_name: user?.company_name || 'CRMos',
      });

      if (disposition === 'Interested' || disposition === 'Afspraak') {
        addPoints(activeUserId, 50);
        toast.success('+50 punten toegekend voor succesvolle lead!');
      } else {
        addPoints(activeUserId, 10);
      }
    }
    setActiveCall(null);
    setShowDisposition(false);
    setCallDuration(0);
    setCallRating(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentContact = activeCall?.contact_id 
    ? contacts.find((c) => c.id === activeCall.contact_id)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Workspace</h1>
          <p className="text-muted-foreground">Make calls and manage your outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <span className="mr-2">Hotkeys:</span>
            <kbd className="rounded bg-muted px-1 text-xs">C</kbd>=Call
            <kbd className="ml-1 rounded bg-muted px-1 text-xs">W</kbd>=End
            <kbd className="ml-1 rounded bg-muted px-1 text-xs">M</kbd>=Mute
            <kbd className="ml-1 rounded bg-muted px-1 text-xs">P</kbd>=Pause
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Calls Made</p>
            <p className="text-2xl font-bold">{todayStats.callsMade}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">{todayStats.callsCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Duration</p>
            <p className="text-2xl font-bold">{Math.floor(todayStats.avgDuration / 60)}:{String(todayStats.avgDuration % 60).padStart(2, '0')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Conversion</p>
            <p className="text-2xl font-bold text-purple-500">{todayStats.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Call Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Control</CardTitle>
          </CardHeader>
          <CardContent>
            {!activeCall ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center py-6 border-b border-border/60">
                  <div className="mb-4 rounded-full bg-primary/10 p-5">
                    <Phone className="h-10 w-10 text-primary" />
                  </div>
                  <p className="mb-1 text-lg font-bold">Bellen via Outbound Werkplek</p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    {contacts.length > 0 
                      ? `Druk op C om direct te starten of zoek hieronder een specifiek contact (${contacts.length} contacten in teams)`
                      : 'Geen contacten gevonden. Voeg contacten toe via het CRM menu.'}
                  </p>
                  <Button size="lg" onClick={() => handleStartCall()} disabled={contacts.length === 0} className="rounded-full px-6">
                    <Phone className="mr-2 h-5 w-5" />
                    Start Volgend Gesprek
                  </Button>
                </div>

                {/* Smart Contact Search right inside Agent Workspace */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Zoek contact op naam (bijv. Reyhan, Julius, Boas), 06-nummer, #tag of team..."
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {smartSearchContacts(contacts, contactSearchQuery)
                      .slice(0, 8)
                      .map((c) => {
                        const cTags = Array.from(
                          new Set([...(c.vvc_tag ? [c.vvc_tag] : []), ...(c.company_tags || []), ...(c.tags || [])])
                        );
                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl border border-border/60 bg-card hover:border-primary/40 flex items-center justify-between gap-3 transition-all"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                  {c.first_name} {c.last_name}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {c.team_name || 'Team Jamal Drenthe'} ({(c.team_status || 'active') === 'active' ? 'Actief' : 'Passief'})
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {c.phone || 'Geen telefoon'} • {c.email || 'Geen e-mail'} • Via {c.referred_by_name || 'Jamal Drenthe'}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {cTags.slice(0, 4).map((t) => (
                                  <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedContactId(c.id)}
                                className="h-8 rounded-xl text-xs gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Profiel &amp; Tags</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStartCall(c)}
                                className="h-8 rounded-xl text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                <span>Bel</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : showDisposition ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-lg font-medium">Gesprek Afgerond</p>
                  <p className="text-3xl font-bold">{formatDuration(callDuration)}</p>
                </div>
                
                <div>
                  <p className="mb-2 text-sm font-medium">Beoordeel dit gesprek (1-5):</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCallRating(star)}
                        className={`rounded-full p-2 ${callRating >= star ? 'bg-yellow-500 text-white' : 'bg-muted'}`}
                      >
                        <Star className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Gespreksnotitie:</p>
                  <Input
                    placeholder="Voer korte opmerking of afspraakdetails in..."
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                    className="mb-4 text-xs"
                  />
                  <p className="mb-2 text-sm font-medium">Selecteer Dispositie (Opslaan in CRM):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleDisposition('Afspraak Gemaakt')} className="justify-start border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 font-semibold">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                      Afspraak Gemaakt
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('Interested')} className="justify-start">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Geïnteresseerd (Warm)
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('Callback')} className="justify-start">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" />
                      Terugbellen
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('Not Interested')} className="justify-start">
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Geen Interesse
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('No Answer')} className="justify-start">
                      <PhoneOff className="mr-2 h-4 w-4 text-gray-500" />
                      Geen Gehoor / Voicemail
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact Info with Full Details, Team, Active/Passive & Inline Tagging */}
                <div className="rounded-2xl bg-muted/50 border border-border/60 p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentContact?.avatar} />
                      <AvatarFallback>
                        {currentContact?.first_name?.[0]}{currentContact?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl font-bold">{activeCall.contact_name}</p>
                        {currentContact && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {currentContact.team_name || 'Team Jamal Drenthe'} (
                            {(currentContact.team_status || 'active') === 'active' ? 'Actief Team' : 'Passief Team'})
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activeCall.to_number} {currentContact?.email ? `• ${currentContact.email}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentContact?.company || 'VVC'} • Aangeleverd door:{' '}
                        <strong className="text-foreground">
                          {currentContact?.referred_by_name || 'Jamal Drenthe'}
                        </strong>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-3xl font-mono font-bold">{formatDuration(callDuration)}</p>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge variant={isPaused ? 'secondary' : 'default'}>
                          {isPaused ? 'Paused' : 'In Progress'}
                        </Badge>
                        {currentContact && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedContactId(currentContact.id)}
                            className="h-7 text-xs rounded-lg gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Volledig Profiel</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentContact && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        {Array.from(
                          new Set([
                            ...(currentContact.vvc_tag ? [currentContact.vvc_tag] : []),
                            ...(currentContact.company_tags || []),
                            ...(currentContact.tags || []),
                          ])
                        ).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] bg-background">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTagText.trim()) {
                              e.preventDefault();
                              addTagToContact(currentContact.id, newTagText.trim());
                              toast.success(`Tag "${newTagText.trim()}" toegevoegd`);
                              setNewTagText('');
                            }
                          }}
                          placeholder="Voeg direct een tag toe tijdens het gesprek..."
                          className="h-8 text-xs rounded-xl bg-background"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!newTagText.trim()) return;
                            addTagToContact(currentContact.id, newTagText.trim());
                            toast.success(`Tag "${newTagText.trim()}" toegevoegd`);
                            setNewTagText('');
                          }}
                          className="h-8 text-xs rounded-xl gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tag</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pitch Flow */}
                <div className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-medium">Pitch Flow</p>
                    <Badge variant="secondary">Step {currentStep + 1} of {pitchSteps.length}</Badge>
                  </div>
                  <Progress value={((currentStep + 1) / pitchSteps.length) * 100} className="mb-4" />
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      {pitchSteps[currentStep].title}
                    </p>
                    <p className="text-lg">{pitchSteps[currentStep].content}</p>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(Math.min(pitchSteps.length - 1, currentStep + 1))}
                      disabled={currentStep === pitchSteps.length - 1}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant={isMuted ? 'destructive' : 'outline'}
                    size="lg"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={isPaused ? 'default' : 'outline'}
                    size="lg"
                    onClick={togglePause}
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Today's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Daily Goal</span>
                    <span>{todayStats.callsMade} / 50</span>
                  </div>
                  <Progress value={(todayStats.callsMade / 50) * 100} className="mt-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span>{todayStats.conversionRate}%</span>
                  </div>
                  <Progress value={todayStats.conversionRate * 2} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Notes */}
          {activeCall && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Call Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add notes about this call..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {useEnhancedStore.getState().leaderboard.slice(0, 3).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center gap-3">
                    <div className={`
                      flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        'bg-amber-600 text-white'}
                    `}>
                      {entry.rank}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.user_name}</p>
                    </div>
                    <span className="text-sm font-bold">{entry.calls_made}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Volledig Contactprofiel & Tags Slide-Over */}
      <Contact360View
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
