import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useCRMStore } from '@/stores/crmStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
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
} from 'lucide-react';

const pitchSteps = [
  { id: 1, title: 'Introduction', content: 'Hi [Name], this is [Agent] from JamCRM. How are you today?' },
  { id: 2, title: 'Discovery', content: 'I\'m calling because I noticed your company is growing rapidly. Are you currently using a CRM system?' },
  { id: 3, title: 'Value Proposition', content: 'JamCRM helps companies like yours increase sales productivity by 40% on average.' },
  { id: 4, title: 'Demo Offer', content: 'I\'d love to show you how it works. Are you available for a quick 15-minute demo this week?' },
  { id: 5, title: 'Close', content: 'Great! I\'ll send you a calendar invite. What\'s the best email to reach you?' },
];

export function AgentWorkspace() {
  const { activeCall, setActiveCall, endCall, todayStats, toggleMute, togglePause, isMuted, isPaused } = useContactCenterStore();
  const { contacts } = useCRMStore();
  const { addPoints } = useEnhancedStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [callRating, setCallRating] = useState(0);
  const [showDisposition, setShowDisposition] = useState(false);
  const [notes, setNotes] = useState('');

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
  }, [activeCall, showDisposition]);

  const handleStartCall = () => {
    const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
    setActiveCall({
      id: 'call-' + Date.now(),
      direction: 'outbound',
      from_number: '+15550001111',
      to_number: randomContact.phone || '+15551234567',
      contact_id: randomContact.id,
      contact_name: `${randomContact.first_name} ${randomContact.last_name}`,
      status: 'in-progress',
      agent_id: 'user1',
      agent_name: 'Alex Johnson',
      campaign_id: '1',
      started_at: new Date().toISOString(),
    });
    setCallDuration(0);
    setCurrentStep(0);
    setShowDisposition(false);
    setNotes('');
    toast.success('Call started - Press W to end');
  };

  const handleEndCall = () => {
    setShowDisposition(true);
  };

  const handleDisposition = (disposition: string) => {
    if (activeCall) {
      endCall(activeCall.id, notes, disposition, callRating);
      if (disposition === 'Interested') {
        addPoints('user1', 50);
        toast.success('+50 points earned!');
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
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-6 rounded-full bg-primary/10 p-6">
                  <Phone className="h-12 w-12 text-primary" />
                </div>
                <p className="mb-2 text-lg font-medium">Ready to make calls</p>
                <p className="mb-6 text-sm text-muted-foreground">Press C or click below to start</p>
                <Button size="lg" onClick={handleStartCall}>
                  <Phone className="mr-2 h-5 w-5" />
                  Start Call
                </Button>
              </div>
            ) : showDisposition ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-lg font-medium">Call Ended</p>
                  <p className="text-3xl font-bold">{formatDuration(callDuration)}</p>
                </div>
                
                <div>
                  <p className="mb-2 text-sm font-medium">Rate this call (1-5):</p>
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
                  <p className="mb-2 text-sm font-medium">Disposition:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleDisposition('Interested')} className="justify-start">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Interested
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('Not Interested')} className="justify-start">
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Not Interested
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('Callback')} className="justify-start">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" />
                      Callback
                    </Button>
                    <Button variant="outline" onClick={() => handleDisposition('No Answer')} className="justify-start">
                      <PhoneOff className="mr-2 h-4 w-4 text-gray-500" />
                      No Answer
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={currentContact?.avatar} />
                    <AvatarFallback>
                      {currentContact?.first_name?.[0]}{currentContact?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xl font-bold">
                      {activeCall.contact_name}
                    </p>
                    <p className="text-muted-foreground">{activeCall.to_number}</p>
                    {currentContact?.company && (
                      <p className="text-sm text-muted-foreground">{currentContact.company}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-mono font-bold">{formatDuration(callDuration)}</p>
                    <Badge variant={isPaused ? 'secondary' : 'default'}>
                      {isPaused ? 'Paused' : 'In Progress'}
                    </Badge>
                  </div>
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
    </div>
  );
}
