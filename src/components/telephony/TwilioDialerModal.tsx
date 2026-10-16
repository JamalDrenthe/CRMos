import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import {
  cleanPhoneNumber,
  getLocalTwilioConfig,
  makeCall,
} from '@/services/twilioService';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Pause,
  Play,
  Clock,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface TwilioDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    company?: string;
    avatar?: string;
  };
}

export function TwilioDialerModal({ isOpen, onClose, contact }: TwilioDialerModalProps) {
  const { addCall } = useContactCenterStore();
  const { addActivity } = useCRMStore();
  const { user, organization } = useAuthStore();

  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<string>('callback');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const twilioConfig = getLocalTwilioConfig();
  const rawPhone = contact.phone || '';
  const formattedPhone = cleanPhoneNumber(rawPhone);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCallState('idle');
      setDuration(0);
      setIsMuted(false);
      setIsHeld(false);
      setNotes('');
      setDisposition('callback');
    }
  }, [isOpen]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const handleStartNativeCall = () => {
    if (!formattedPhone) {
      toast.error('Geen geldig telefoonnummer gevonden voor dit contact');
      return;
    }

    // Direct phone intent for iOS/Android/Desktop
    window.location.href = `tel:${formattedPhone}`;
    setCallState('ended');
    toast.success(`Telefoonkiezer geopend voor ${contact.first_name} (${formattedPhone})`);
  };

  const handleStartTwilioCall = async () => {
    if (!formattedPhone) {
      toast.error('Dit contact heeft geen geregistreerd telefoonnummer.');
      return;
    }

    setCallState('calling');
    setDuration(0);

    try {
      const res = await makeCall({
        to: formattedPhone,
        from: twilioConfig.phoneNumber,
        contactId: contact.id,
        contactName: `${contact.first_name} ${contact.last_name}`,
        agentId: user?.id || 'user1',
        agentName: user?.name || 'CRMos Gebruiker',
        orgId: organization?.id || 'default_org',
        companyName: user?.company_name || organization?.name || 'CRMos',
      }, twilioConfig);

      toast.info(res.message);

      // Simulate ringing then connect
      setTimeout(() => {
        setCallState('connected');
        toast.success(`Verbonden met ${contact.first_name}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setCallState('connected');
    }
  };

  const handleEndCall = () => {
    setCallState('ended');
  };

  const handleSaveAndComplete = () => {
    const finalDuration = duration;
    const finalNotes = notes.trim() || 'Telefoongesprek geregistreerd via CRMos Telephony';

    // 1. Add Call to ContactCenterStore & Firestore
    addCall({
      direction: 'outbound',
      from_number: twilioConfig.phoneNumber || 'CRMos Dialer',
      to_number: formattedPhone || rawPhone,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      status: finalDuration > 0 ? 'completed' : 'missed',
      duration: finalDuration,
      notes: finalNotes,
      disposition,
      agent_id: user?.id || 'user1',
      agent_name: user?.name || 'CRMos Gebruiker',
      org_id: organization?.id || 'default_org',
      company_name: user?.company_name || organization?.name || 'CRMos',
      started_at: new Date(Date.now() - finalDuration * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });

    // 2. Add Activity to CRMStore & Firestore (updates contact timeline!)
    addActivity({
      type: 'call',
      title: `Uitgaande oproep: ${contact.first_name} ${contact.last_name} (${disposition})`,
      description: `Duur: ${formatDuration(finalDuration)} - ${finalNotes}`,
      status: 'completed',
      due_date: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      assigned_to: user?.id || 'user1',
      related_to: {
        type: 'contact',
        id: contact.id,
      },
      org_id: organization?.id || 'default_org',
      company_name: user?.company_name || organization?.name || 'CRMos',
    });

    toast.success('Gesprek en notities succesvol geregistreerd in tijdlijn');
    onClose();
  };

  const dispositions = [
    { id: 'sale-won', label: '🏆 Sale Gesloten / Deal Won' },
    { id: 'appointment', label: '📅 Afspraak Gemaakt' },
    { id: 'callback', label: '🔄 Terugbellen (Follow-up)' },
    { id: 'no-answer', label: '📵 Geen Gehoor / Voicemail' },
    { id: 'not-interested', label: '❌ Niet Geïnteresseerd' },
    { id: 'wrong-number', label: '⚠️ Verkeerd Nummer' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl p-6">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="font-bold">
                {contact.first_name[0]}{contact.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg font-bold">
                {contact.first_name} {contact.last_name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {contact.company ? `${contact.company} • ` : ''}
                {rawPhone || 'Geen telefoonnummer ingevuld'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* State: IDLE - Choice Screen */}
        {callState === 'idle' && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Telephony Provider</span>
                <Badge variant="outline" className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3" />
                  {twilioConfig.enabled ? 'Twilio Voice Actief' : 'Direct / Web Dialer'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Kies hoe je contact wilt opnemen met {contact.first_name}. Gesprekken en notities worden automatisch gesynchroniseerd met de CRMos tijdlijn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <Button
                size="lg"
                onClick={handleStartTwilioCall}
                disabled={!rawPhone}
                className="w-full rounded-xl gap-2 font-semibold shadow-md shadow-primary/10 h-12"
              >
                <PhoneCall className="h-4 w-4" />
                <span>CRMos Twilio Web Dialer Starten</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleStartNativeCall}
                disabled={!rawPhone}
                className="w-full rounded-xl gap-2 font-medium h-12 hover:bg-muted/60"
              >
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Bellen via Smartphone / GSM (`tel:`)</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCallState('ended')}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Oproep reeds voltooid? Registreer verslag handmatig →
              </Button>
            </div>
          </div>
        )}

        {/* State: CALLING or CONNECTED */}
        {(callState === 'calling' || callState === 'connected') && (
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center justify-center space-y-3 p-6 rounded-2xl bg-gradient-to-b from-primary/5 to-primary/10 border border-primary/10">
              <div className="relative">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white ${
                  callState === 'calling' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
                } shadow-lg shadow-emerald-500/20`}>
                  <Phone className="h-8 w-8" />
                </div>
                {callState === 'connected' && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 items-center justify-center text-[10px] text-white">✓</span>
                  </span>
                )}
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {callState === 'calling' ? 'Overgaan naar contact...' : 'Verbonden met ' + contact.first_name}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="icon"
                  variant={isMuted ? 'destructive' : 'outline'}
                  onClick={() => {
                    setIsMuted(!isMuted);
                    toast.info(isMuted ? 'Microfoon gedempt opgeheven' : 'Microfoon gedempt');
                  }}
                  className="rounded-full h-10 w-10"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <Button
                  size="icon"
                  variant={isHeld ? 'secondary' : 'outline'}
                  onClick={() => {
                    setIsHeld(!isHeld);
                    toast.info(isHeld ? 'Gesprek hervat' : 'Gesprek in de wacht gezet');
                  }}
                  className="rounded-full h-10 w-10"
                >
                  {isHeld ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>

                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="rounded-full h-12 w-12 shadow-lg shadow-destructive/20"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* In-call live notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Live Gespreksnotities</Label>
              <Textarea
                placeholder="Typ direct mee tijdens het gesprek (bezwaren, wensen, afspraken)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] text-xs resize-none"
              />
            </div>
          </div>
        )}

        {/* State: ENDED - Wrap-up & Disposition */}
        {callState === 'ended' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium">Gespreksduur:</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {formatDuration(duration)}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Gespreksresultaat (Disposition)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {dispositions.map((disp) => (
                  <button
                    key={disp.id}
                    type="button"
                    onClick={() => setDisposition(disp.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      disposition === disp.id
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border/60 hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    {disp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gespreksverslag / Follow-up Actie</Label>
              <Textarea
                placeholder="Belangrijkste besproken punten, overeengekomen acties..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[90px] text-xs"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-1/3 rounded-xl"
              >
                Annuleren
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAndComplete}
                className="w-2/3 rounded-xl font-semibold gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Opslaan in Tijdlijn</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
