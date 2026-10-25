import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { D2DAddressPin } from '@/types';
import { useD2DStore } from '@/stores/d2dStore';
import { useCRMStore } from '@/stores/crmStore';
import { useAuthStore } from '@/stores/authStore';
import { getVvcTag, syncVvcRecordToCloud } from '@/services/vvcTagService';
import { toast } from 'sonner';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  CreditCard,
  FileSignature,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Briefcase,
  Check,
  Tag,
  Copy,
} from 'lucide-react';

interface SalesdockSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: D2DAddressPin | null;
  onSaleCompleted?: (updatedPin: D2DAddressPin, orderId: string) => void;
}

export type SalesProposition = {
  id: string;
  name: string;
  category: string;
  defaultMonthly: number;
  defaultSetup: number;
  popular?: boolean;
};

const DEFAULT_PROPOSITIONS: SalesProposition[] = [
  {
    id: 'crmos_pro',
    name: 'CRMos Pro Bedrijfspakket',
    category: 'Software & CRM',
    defaultMonthly: 149,
    defaultSetup: 250,
    popular: true,
  },
  {
    id: 'zakelijk_glasvezel',
    name: 'Zakelijk Glasvezel 1000 Mbps + VoIP',
    category: 'Telecom & Netwerk',
    defaultMonthly: 89,
    defaultSetup: 0,
    popular: true,
  },
  {
    id: 'energie_zakelijk',
    name: 'Zakelijke Groene Energie (Grootverbruik)',
    category: 'Energie & Nutsvoorziening',
    defaultMonthly: 320,
    defaultSetup: 0,
  },
  {
    id: 'pin_betaalterminal',
    name: 'Mobiele Betaalterminal & POS Kassasysteem',
    category: 'Fintech & Betalingen',
    defaultMonthly: 49,
    defaultSetup: 99,
  },
  {
    id: 'marketing_campagne',
    name: 'D2D Buitendienst Marketing Campagne',
    category: 'Field Marketing',
    defaultMonthly: 850,
    defaultSetup: 500,
  },
];

function formatIBAN(val: string): string {
  const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

function detectBankFromIBAN(iban: string): string | null {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 8) return null;
  const bankCode = clean.substring(4, 8);
  const banks: Record<string, string> = {
    ABNA: 'ABN AMRO',
    INGB: 'ING Bank',
    RABO: 'Rabobank',
    SNSB: 'SNS Bank',
    ASNB: 'ASN Bank',
    TRIO: 'Triodos Bank',
    BUNQ: 'bunq',
    KNAB: 'Knab',
    FVLB: 'Van Lanschot Kempen',
    REGN: 'RegioBank',
  };
  return banks[bankCode] || null;
}

export function SalesdockSaleModal({
  isOpen,
  onClose,
  pin,
  onSaleCompleted,
}: SalesdockSaleModalProps) {
  const { logVisit } = useD2DStore();
  const { addDeal, addCompany, addContact, updateContact, companies, contacts } = useCRMStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [completedVvcTag, setCompletedVvcTag] = useState<string | null>(null);

  // Step 1: Bedrijf & Beslisser
  const [companyName, setCompanyName] = useState('');
  const [kvkNumber, setKvkNumber] = useState('');
  const [legalForm, setLegalForm] = useState('BV');
  const [salutation, setSalutation] = useState<'Dhr.' | 'Mvr.'>('Dhr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [decisionMakerRole, setDecisionMakerRole] = useState('Eigenaar / Directeur');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Propositie & Dealwaarden
  const [selectedPropId, setSelectedPropId] = useState<string>(DEFAULT_PROPOSITIONS[0].id);
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(24);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(DEFAULT_PROPOSITIONS[0].defaultMonthly);
  const [setupPrice, setSetupPrice] = useState<number>(DEFAULT_PROPOSITIONS[0].defaultSetup);
  const [discountCode, setDiscountCode] = useState('');
  const [dealNotes, setDealNotes] = useState('');

  // Step 3: Betaling & SEPA
  const [paymentMethod, setPaymentMethod] = useState<'sepa' | 'invoice'>('sepa');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );

  // Step 4: Handtekening & Akkoord
  const [hasSignature, setHasSignature] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  const [internalMemo, setInternalMemo] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Initialize form with pin data on open
  useEffect(() => {
    if (pin) {
      setCompanyName(pin.business_name || (pin.is_commercial ? `Bedrijf ${pin.street} ${pin.house_number}` : ''));
      setAccountHolder(pin.business_name || '');
      setPhone(pin.business_phone || '');
      setEmail(pin.business_email || '');
      setCompletedOrderId(null);
      setStep(1);
      setHasSignature(false);
    }
  }, [pin, isOpen]);

  // Handle selected proposition changes
  const handleSelectProposition = (prop: SalesProposition) => {
    setSelectedPropId(prop.id);
    setMonthlyPrice(prop.defaultMonthly);
    setSetupPrice(prop.defaultSetup);
  };

  // Real-time calculated total contract value
  const totalContractValue = monthlyPrice * contractDurationMonths + setupPrice;

  // Signature canvas setup
  useEffect(() => {
    if (step === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [step]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Step 1 Validation
  const canProceedStep1 = companyName.trim().length > 1 && firstName.trim().length > 0 && lastName.trim().length > 0;

  // Step 3 Bank Detection
  const detectedBank = detectBankFromIBAN(iban);

  // Final Submit Handler: Realiseert Salesdock Order Registratie
  const handleFinalOrderSubmit = async () => {
    if (!pin) return;
    if (!hasSignature) {
      toast.error('Laat de klant eerst digitaal ondertekenen voor akkoord');
      return;
    }
    if (!agreeTerms) {
      toast.error('De voorwaarden moeten worden geaccordeerd');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const activeProp = DEFAULT_PROPOSITIONS.find((p) => p.id === selectedPropId);
      const repName = user?.name || user?.email || 'Field Sales Agent';

      const orderSummaryText = `[Salesdock Order #${orderId}] ${activeProp?.name || 'Contract'} - €${monthlyPrice}/mnd (${contractDurationMonths} mnd) + €${setupPrice} setup. Totaal: €${totalContractValue.toLocaleString('nl-NL')}. Getekend door: ${salutation} ${firstName} ${lastName} (${decisionMakerRole}). IBAN: ${iban ? `${iban.slice(0, 8)}... (${detectedBank || 'SEPA'})` : 'Op factuur'}.${internalMemo ? ` Memo: ${internalMemo}` : ''}`;

      // 1. Log visit on the D2D Pin -> sets status to deal_closed
      const updatedPin = logVisit(
        pin.id,
        'deal_closed',
        orderSummaryText,
        undefined,
        user?.id,
        repName,
        pin
      );

      // 2. Maak of update Company in het CRM
      const existingCompany = companies.find(
        (c) => c.name.toLowerCase().trim() === companyName.toLowerCase().trim()
      );
      let companyId = existingCompany?.id;
      if (!existingCompany) {
        const newComp = addCompany({
          name: companyName,
          industry: pin.branch || 'Zakelijke Dienstverlening',
          address: {
            street: `${pin.street} ${pin.house_number}${pin.house_number_addition || ''}`,
            city: pin.city,
            postal_code: pin.postal_code,
            country: 'Nederland',
          },
          phone: phone || undefined,
          size: '1-10',
          contacts_count: 1,
          deals_count: 1,
        });
        companyId = newComp.id;
      }

      // 3. Maak Contactpersoon aan in het CRM met standaard gekoppelde VVC tag
      const existingContact = contacts.find(
        (c) =>
          c.company_id === companyId ||
          (email && c.email.toLowerCase() === email.toLowerCase())
      );
      let contactId = existingContact?.id;
      let vvcTag = existingContact ? getVvcTag(existingContact) : undefined;
      if (!existingContact) {
        const newContact = addContact({
          first_name: firstName,
          last_name: lastName,
          email: email || `${firstName.toLowerCase()}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bedrijf'}.nl`,
          phone: phone || pin.business_phone || '',
          title: decisionMakerRole,
          company: companyName,
          company_id: companyId,
          status: 'customer',
          address: {
            street: `${pin.street} ${pin.house_number}${pin.house_number_addition || ''}`,
            city: pin.city,
            postal_code: pin.postal_code,
            country: 'Nederland',
          },
          score: 95,
          source: 'Field D2D - Salesdock',
          tags: ['Aanmelding', 'Field Sale', 'Salesdock Order'],
          custom_fields: {},
        });
        contactId = newContact.id;
        vvcTag = newContact.vvc_tag || getVvcTag(newContact) || `vvc-${newContact.id}`;
      } else {
        vvcTag = vvcTag || `vvc-${existingContact.id}`;
        updateContact(existingContact.id, {
          vvc_tag: vvcTag,
          status: 'customer',
          tags: Array.from(
            new Set([vvcTag, ...(existingContact.tags || []), 'Aanmelding', 'Field Sale', 'Salesdock Order'])
          ),
        });
      }

      // Synchroniseer de volledige aanmelding & sale naar vvc_sync_codes en crm_vvc_registry voor VVC API ophalen
      if (vvcTag) {
        await syncVvcRecordToCloud({
          vvc_tag: vvcTag,
          registration_type: 'field_sale',
          entity_id: contactId || orderId,
          first_name: firstName,
          last_name: lastName,
          full_name: `${salutation} ${firstName} ${lastName}`.trim(),
          email: email || `${firstName.toLowerCase()}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bedrijf'}.nl`,
          phone: phone || pin.business_phone || '',
          company: companyName,
          title: decisionMakerRole,
          status: 'customer',
          source: 'Field D2D - Salesdock',
          location: `${pin.street} ${pin.house_number}, ${pin.postal_code} ${pin.city}`,
          deal_value: totalContractValue,
          order_id: orderId,
          kvk_number: kvkNumber || undefined,
          org_id: user?.org_id || 'default_org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 4. Maak een Deal aan in het CRM (in stage 'closed-won')
      addDeal({
        name: `${companyName} - ${activeProp?.name || 'Field Sale Order'}`,
        value: totalContractValue,
        currency: 'EUR',
        stage: 'closed-won',
        probability: 100,
        company_id: companyId || `comp_${Date.now()}`,
        company_name: companyName,
        contact_id: contactId,
        contact_name: `${firstName} ${lastName}`,
        pipeline_id: '1',
        source: 'Field D2D - Salesdock',
        assigned_to: user?.id || 'current_user',
        assigned_name: repName,
        vvc_tag: vvcTag,
        tags: vvcTag ? ['Field Sale', 'Salesdock Order', `#${orderId}`, vvcTag] : ['Field Sale', 'Salesdock Order', `#${orderId}`],
        activities: [],
        expected_close_date: new Date().toISOString(),
        actual_close_date: new Date().toISOString(),
      });

      setCompletedOrderId(orderId);
      setCompletedVvcTag(vvcTag || null);
      toast.success(`🎉 Sale geregistreerd! Order #${orderId} • VVC Tag: ${vvcTag}`);

      if (onSaleCompleted && updatedPin) {
        onSaleCompleted(updatedPin, orderId);
      }
    } catch (err) {
      console.error('Fout bij registreren van Salesdock sale:', err);
      toast.error('Er is een fout opgetreden bij het afronden van de order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-h-[92vh] overflow-y-auto rounded-3xl p-0 bg-background border shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Sale Registreren - Salesdock Bestelstraat</DialogTitle>
        </DialogHeader>
        {/* Top Header Strip */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white rounded-t-3xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <Sparkles className="h-44 w-44" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-semibold backdrop-blur-md">
                  Salesdock Bestelstraat
                </Badge>
                <span className="text-white/80 text-xs font-medium">Field D2D Order Intake</span>
              </div>
              <h2 className="text-2xl font-extrabold mt-1 tracking-tight">Sale Registreren</h2>
              <p className="text-white/90 text-xs mt-0.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>
                  {pin?.street} {pin?.house_number}{pin?.house_number_addition || ''}, {pin?.postal_code} {pin?.city}
                </span>
              </p>
            </div>

            {/* Live Contract Value Badge */}
            <div className="text-right bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <span className="text-[10px] text-white/80 font-medium block uppercase tracking-wider">Totale Waarde</span>
              <span className="text-xl font-extrabold text-white">€{totalContractValue.toLocaleString('nl-NL')}</span>
            </div>
          </div>

          {/* Stepper Tabs */}
          {!completedOrderId && (
            <div className="grid grid-cols-4 gap-2 mt-5 pt-3 border-t border-white/20">
              {[
                { s: 1, label: '1. Klant' },
                { s: 2, label: '2. Contract' },
                { s: 3, label: '3. SEPA' },
                { s: 4, label: '4. Akkoord' },
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  disabled={item.s > step}
                  onClick={() => setStep(item.s as any)}
                  className={`text-left py-1.5 px-2 rounded-xl transition-all text-xs font-semibold ${
                    step === item.s
                      ? 'bg-white text-emerald-800 shadow-md font-bold'
                      : item.s < step
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'text-white/60 cursor-not-allowed'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {completedOrderId ? (
            /* Success Order Screen */
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-16 w-16 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-mono font-bold">
                  Order #{completedOrderId}
                </Badge>
                <h3 className="text-2xl font-extrabold text-foreground mt-2">Gefeliciteerd met de Sale!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  De bestelling voor <strong>{companyName}</strong> is officieel vastgelegd, ondertekend en gesynchroniseerd met je CRM pipeline.
                </p>
              </div>

              {/* Order Summary Receipt Box */}
              <Card className="max-w-md mx-auto rounded-2xl border text-left bg-muted/30">
                <CardContent className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Klant:</span>
                    <span className="font-bold">{salutation} {firstName} {lastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bedrijf:</span>
                    <span className="font-semibold">{companyName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pakket:</span>
                    <span className="font-semibold">{DEFAULT_PROPOSITIONS.find((p) => p.id === selectedPropId)?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Looptijd:</span>
                    <span>{contractDurationMonths} maanden</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Totale Contractwaarde:</span>
                    <span>€{totalContractValue.toLocaleString('nl-NL')}</span>
                  </div>
                  {completedVvcTag && (
                    <div className="flex justify-between items-center pt-2.5 border-t border-amber-500/30">
                      <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-amber-500" />
                        <span>Unieke VVC API Tag:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(completedVvcTag);
                          toast.success(`VVC API tag gekopieerd: ${completedVvcTag}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                      >
                        <span>{completedVvcTag}</span>
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="pt-2 flex justify-center gap-3">
                <Button onClick={onClose} className="rounded-xl px-6 font-semibold">
                  Terug naar Kaart
                </Button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STAP 1: Bedrijf & Beslisser */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Bedrijfs- en Klantgegevens</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Officiële Bedrijfsnaam *</Label>
                  <Input
                    placeholder="bijv. Jansen Logistiek B.V."
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (!accountHolder) setAccountHolder(e.target.value);
                    }}
                    className="rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">KVK-nummer (Optioneel)</Label>
                  <Input
                    placeholder="8 cijfers, bijv. 87654321"
                    value={kvkNumber}
                    onChange={(e) => setKvkNumber(e.target.value)}
                    maxLength={8}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Rechtsvorm</Label>
                  <select
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                  >
                    <option value="BV">Besloten Vennootschap (B.V.)</option>
                    <option value="VOF">Vennootschap onder firma (V.O.F.)</option>
                    <option value="Eenmanszaak">Eenmanszaak / Zelfstandige</option>
                    <option value="Stichting">Stichting</option>
                    <option value="Maatschap">Maatschap</option>
                    <option value="NV">Naamloze Vennootschap (N.V.)</option>
                  </select>
                </div>
              </div>

              {/* Beslisser Contactpersoon */}
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-xs text-foreground">Tekengerechtigde Beslisser</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs">Aanhef</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={salutation === 'Dhr.' ? 'default' : 'outline'}
                        onClick={() => setSalutation('Dhr.')}
                        className="rounded-xl flex-1 text-xs h-9"
                      >
                        Dhr.
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={salutation === 'Mvr.' ? 'default' : 'outline'}
                        onClick={() => setSalutation('Mvr.')}
                        className="rounded-xl flex-1 text-xs h-9"
                      >
                        Mvr.
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs">Voornaam *</Label>
                    <Input
                      placeholder="bijv. Mark"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs">Achternaam *</Label>
                    <Input
                      placeholder="bijv. de Vries"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Functie</Label>
                    <Input
                      placeholder="bijv. Eigenaar / Directeur"
                      value={decisionMakerRole}
                      onChange={(e) => setDecisionMakerRole(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mailadres (voor akkoord)</Label>
                    <Input
                      type="email"
                      placeholder="directie@bedrijf.nl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Telefoonnummer</Label>
                    <Input
                      type="tel"
                      placeholder="06-12345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* STAP 2: Propositie & Dealwaarden */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Productselectie & Campagnevoorstel</h3>
              </div>

              {/* Proposition Cards */}
              <div className="space-y-2">
                <Label className="text-xs">Kies het verkochte pakket:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_PROPOSITIONS.map((prop) => {
                    const isSelected = selectedPropId === prop.id;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleSelectProposition(prop)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                            : 'hover:bg-muted/40 border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-xs text-foreground">{prop.name}</p>
                          {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{prop.category}</p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50 text-[11px]">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            €{prop.defaultMonthly}/mnd
                          </span>
                          <span className="text-muted-foreground font-mono">
                            Setup: €{prop.defaultSetup}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Looptijd & Financiële Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Looptijd contract</Label>
                  <select
                    value={contractDurationMonths}
                    onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                  >
                    <option value={1}>Maandelijks opzegbaar (1 mnd)</option>
                    <option value={12}>12 maanden (1 Jaar)</option>
                    <option value={24}>24 maanden (2 Jaar - Aanbevolen)</option>
                    <option value={36}>36 maanden (3 Jaar)</option>
                    <option value={60}>60 maanden (5 Jaar)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Maandbedrag (€)</Label>
                  <Input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Math.max(0, Number(e.target.value)))}
                    className="rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Aansluitkosten (€)</Label>
                  <Input
                    type="number"
                    value={setupPrice}
                    onChange={(e) => setSetupPrice(Math.max(0, Number(e.target.value)))}
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Kortingscode / Notitie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Campagne- / Actiecode</Label>
                  <Input
                    placeholder="bijv. ZOMER2026 of AGENT-DEAL"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="rounded-xl uppercase font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Maatwerkafspraken</Label>
                  <Input
                    placeholder="bijv. Vrije installatie in week 43"
                    value={dealNotes}
                    onChange={(e) => setDealNotes(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          ) : step === 3 ? (
            /* STAP 3: Facturatie & SEPA */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Betaalmethode & SEPA Machtiging</h3>
              </div>

              {/* Payment Method Switch */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('sepa')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'sepa'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'hover:bg-muted/40 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">SEPA Incasso</span>
                    {paymentMethod === 'sepa' && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Automatische maandelijkse afschrijving (Salesdock Standaard)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('invoice')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'invoice'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'hover:bg-muted/40 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Factuur</span>
                    {paymentMethod === 'invoice' && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Betaaltermijn 14 dagen per e-mailfactuur
                  </p>
                </button>
              </div>

              {paymentMethod === 'sepa' && (
                <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs">IBAN Rekeningnummer *</Label>
                      {detectedBank && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold">
                          🏦 {detectedBank}
                        </Badge>
                      )}
                    </div>
                    <Input
                      placeholder="NL91 ABNA 0417 1234 56"
                      value={iban}
                      onChange={(e) => setIban(formatIBAN(e.target.value))}
                      className="rounded-xl font-mono text-sm uppercase tracking-wider"
                      maxLength={22}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Tenaamstelling rekening *</Label>
                    <Input
                      placeholder="bijv. Jansen Logistiek B.V."
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Gewenste Ingangsdatum / Oplevering</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl text-xs max-w-xs"
                />
              </div>
            </div>
          ) : (
            /* STAP 4: Digitale Handtekening & Akkoord */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b">
                <FileSignature className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Digitale Handtekening & Formeel Akkoord</h3>
              </div>

              {/* Order Recap Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-foreground">
                    {companyName} &bull; {salutation} {firstName} {lastName}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {DEFAULT_PROPOSITIONS.find((p) => p.id === selectedPropId)?.name} ({contractDurationMonths} mnd)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-muted-foreground block">Totale Contractwaarde:</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    €{totalContractValue.toLocaleString('nl-NL')}
                  </span>
                </div>
              </div>

              {/* Interactive Signature Canvas (Salesdock Feel) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <FileSignature className="h-3.5 w-3.5 text-primary" />
                    <span>Teken hieronder op het scherm voor akkoord *</span>
                  </Label>
                  {hasSignature && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSignature}
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Wissen
                    </Button>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-border/80 rounded-2xl bg-card overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    className="w-full h-40 touch-none cursor-crosshair bg-slate-50 dark:bg-slate-900/50"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/50 text-xs italic">
                      Zet handtekening met vinger, stylus of muis...
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Checkboxes */}
              <div className="space-y-2.5 pt-1 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-input h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-muted-foreground">
                    Ondergetekende verklaart bevoegd te zijn namens <strong>{companyName || 'het bedrijf'}</strong> deze overeenkomst aan te gaan en gaat akkoord met de algemene leveringsvoorwaarden.
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendConfirmationEmail}
                    onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                    className="rounded border-input h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-muted-foreground">
                    Stuur direct een digitale orderbevestiging per e-mail naar {email || 'het opgegeven e-mailadres'}.
                  </span>
                </label>
              </div>

              {/* Interne Notitie */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">Interne notitie voor de Backoffice / Manager (Optioneel)</Label>
                <Textarea
                  placeholder="bijv. Afgesproken dat contactpersoon zelf contact opneemt met de servicedesk..."
                  value={internalMemo}
                  onChange={(e) => setInternalMemo(e.target.value)}
                  className="rounded-xl text-xs h-16 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {!completedOrderId && (
          <div className="p-4 px-6 bg-muted/40 border-t flex items-center justify-between gap-3 rounded-b-3xl">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="rounded-xl gap-1 text-xs h-9 px-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Vorige
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs h-9"
              >
                Annuleren
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                size="sm"
                disabled={step === 1 && !canProceedStep1}
                onClick={() => setStep((s) => (s + 1) as any)}
                className="rounded-xl gap-1 text-xs h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <span>Volgende stap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting || !hasSignature || !agreeTerms}
                onClick={handleFinalOrderSubmit}
                className="rounded-xl gap-1.5 text-xs h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all hover:scale-[1.02]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isSubmitting ? 'Order Verwerken...' : 'Order Bevestigen & Sale Registreren'}</span>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
