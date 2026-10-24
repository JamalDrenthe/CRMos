import { useState, useEffect } from 'react';
import type { ComponentProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
import { useQuotesStore } from '@/stores/quotesStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import type { Quote, QuoteItem } from '@/types';
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Euro,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function QuotesPage() {
  const { deals, companies } = useCRMStore();
  const { quotes, addQuote, updateQuote, deleteQuote, syncWithFirestore } = useQuotesStore();
  const { user, organization } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for creating a new quote
  const [newQuoteTitle, setNewQuoteTitle] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [validUntilDays, setValidUntilDays] = useState(30);
  const [quoteItems, setQuoteItems] = useState<Array<{ name: string; quantity: number; unit_price: number }>>([
    { name: 'CRMos Pro Bedrijfslicentie (12 mnd)', quantity: 1, unit_price: 2400 },
  ]);

  // Firestore sync on mount
  useEffect(() => {
    const orgId = user?.org_id || organization?.id || 'default_org';
    const unsub = syncWithFirestore(orgId);
    return () => unsub();
  }, [user?.org_id, organization?.id, syncWithFirestore]);

  // Calculate live totals
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  const taxRate = 21;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleAddItem = () => {
    setQuoteItems([...quoteItems, { name: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (quoteItems.length <= 1) return;
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'quantity' | 'unit_price', val: string | number) => {
    setQuoteItems(
      quoteItems.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleCreateQuote = () => {
    if (!newQuoteTitle.trim()) {
      toast.error('Vul een titel of omschrijving in voor de offerte');
      return;
    }

    const company = companies.find((c) => c.id === selectedCompanyId);
    const deal = deals.find((d) => d.id === selectedDealId);

    const formattedItems: QuoteItem[] = quoteItems.map((item, idx) => ({
      id: `item_${idx + 1}`,
      name: item.name || 'Dienst / Product',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      discount_percent: 0,
      total: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
    }));

    const quoteNumber = `OFF-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;

    addQuote({
      quote_number: quoteNumber,
      title: newQuoteTitle.trim(),
      deal_id: selectedDealId || undefined,
      company_id: selectedCompanyId || undefined,
      customer_name: company?.name || deal?.company_name || 'Zakelijke Klant',
      items: formattedItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_amount: 0,
      total,
      currency: 'EUR',
      status: 'draft',
      valid_until: new Date(Date.now() + validUntilDays * 86400000).toISOString(),
      created_by: user?.name || 'Accountmanager',
      org_id: organization?.id || 'default_org',
      company_name: user?.company_name || 'CRMos',
    });

    setIsAddDialogOpen(false);
    setNewQuoteTitle('');
    setSelectedCompanyId('');
    setSelectedDealId('');
    setQuoteItems([{ name: 'CRMos Pro Bedrijfslicentie (12 mnd)', quantity: 1, unit_price: 2400 }]);
    toast.success(`Offerte ${quoteNumber} succesvol aangemaakt!`);
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.customer_name && quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    {
      accessorKey: 'quote_number',
      header: 'Offerte #',
      cell: ({ row }: { row: { original: Quote } }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-xs">{row.original.quote_number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Onderwerp & Klant',
      cell: ({ row }: { row: { original: Quote } }) => (
        <div>
          <p className="font-semibold text-xs truncate max-w-[200px]">{row.original.title}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3" />
            {row.original.customer_name || 'Directe Klant'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Totaalbedrag',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="font-bold text-xs text-emerald-600">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Quote } }) => {
        const statusConfig: Record<
          Quote['status'],
          { variant: NonNullable<ComponentProps<typeof Badge>['variant']>; icon: typeof Clock; label: string }
        > = {
          draft: { variant: 'secondary', icon: Clock, label: 'Concept' },
          sent: { variant: 'default', icon: Send, label: 'Verzonden' },
          accepted: { variant: 'default', icon: CheckCircle2, label: 'Geaccepteerd' },
          rejected: { variant: 'destructive', icon: XCircle, label: 'Afgewezen' },
          expired: { variant: 'outline', icon: Clock, label: 'Verlopen' },
        };
        const config = statusConfig[row.original.status] || statusConfig.draft;
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="text-[10px] px-2 py-0.5">
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'valid_until',
      header: 'Geldig Tot',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.valid_until ? format(new Date(row.original.valid_until), 'd MMM yyyy') : 'Onbeperkt'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Quote } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              onClick={() => setViewingQuote(row.original)}
              className="gap-2 cursor-pointer text-xs"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Inzien</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast.success(`Offerte ${row.original.quote_number} geëxporteerd als PDF`);
              }}
              className="gap-2 cursor-pointer text-xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            {row.original.status === 'draft' && (
              <DropdownMenuItem
                onClick={() => {
                  updateQuote(row.original.id, { status: 'sent' });
                  toast.success(`Offerte ${row.original.quote_number} gemarkeerd als verzonden`);
                }}
                className="gap-2 cursor-pointer text-xs text-primary"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Markeer als Verzonden</span>
              </DropdownMenuItem>
            )}
            {row.original.status === 'sent' && (
              <DropdownMenuItem
                onClick={() => {
                  updateQuote(row.original.id, { status: 'accepted' });
                  toast.success(`🎉 Offerte ${row.original.quote_number} gemarkeerd als geaccepteerd!`);
                }}
                className="gap-2 cursor-pointer text-xs text-emerald-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Markeer als Geaccepteerd</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                deleteQuote(row.original.id);
                toast.success(`Offerte ${row.original.quote_number} verwijderd`);
              }}
              className="gap-2 cursor-pointer text-xs text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Verwijderen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quotes & Offertes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Beheer zakelijke prijsopgaven, voorstellen en verkoopcontracten
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="rounded-full shadow-sm gap-1.5 h-10 px-5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          Nieuwe Offerte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Totaal Offertes</p>
            <p className="text-2xl font-bold">{quotes.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Concepten</p>
            <p className="text-2xl font-bold">
              {quotes.filter((q) => q.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Behandeling (Verzonden)</p>
            <p className="text-2xl font-bold">
              {quotes.filter((q) => q.status === 'sent').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Geaccepteerd</p>
            <p className="text-2xl font-bold text-emerald-500">
              {quotes.filter((q) => q.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek offertes op nummer, klant of titel..."
            className="pl-9 h-10 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredQuotes}
        onRowClick={(row) => setViewingQuote(row)}
      />

      {/* Create Quote Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nieuwe Offerte Genereren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Titel / Onderwerp *</Label>
              <Input
                placeholder="bijv. Licentieovereenkomst CRMos Suite Q4"
                value={newQuoteTitle}
                onChange={(e) => setNewQuoteTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Klantbedrijf</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  <option value="">-- Kies klantbedrijf --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Gekoppelde Deal (Optioneel)</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                  value={selectedDealId}
                  onChange={(e) => setSelectedDealId(e.target.value)}
                >
                  <option value="">-- Geen deal gekoppeld --</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({formatCurrency(d.value)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Geldigheidsduur</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs h-9"
                value={validUntilDays}
                onChange={(e) => setValidUntilDays(Number(e.target.value))}
              >
                <option value={14}>14 dagen</option>
                <option value={30}>30 dagen (Standaard)</option>
                <option value={60}>60 dagen</option>
                <option value={90}>90 dagen</option>
              </select>
            </div>

            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Product- en Dienstregels</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs rounded-full gap-1"
                >
                  <Plus className="h-3 w-3" /> Regel toevoegen
                </Button>
              </div>

              {quoteItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-xl">
                  <div className="col-span-6">
                    <Input
                      placeholder="Product / Omschrijving"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Aantal"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Prijs (€)"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs border border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotaal excl. btw</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Btw (21%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border/40">
                <span>Totaal incl. btw</span>
                <span className="text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleCreateQuote}
              className="w-full rounded-xl h-10 font-semibold"
            >
              Offerte Opslaan & Genereren
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Quote Modal */}
      <Dialog open={!!viewingQuote} onOpenChange={(open) => !open && setViewingQuote(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>{viewingQuote?.quote_number}</span>
              <Badge variant="secondary" className="capitalize text-xs font-semibold">
                {viewingQuote?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Offertetotaal</span>
                <span className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  {formatCurrency(viewingQuote.total)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Titel / Onderwerp</span>
                  <p className="font-semibold text-xs truncate">{viewingQuote.title}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Klant / Bedrijf</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {viewingQuote.customer_name || 'Geen toewijzing'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Geldig Tot</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {viewingQuote.valid_until ? format(new Date(viewingQuote.valid_until), 'd MMM yyyy') : 'Onbeperkt'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {viewingQuote.status}
                  </Badge>
                </div>
              </div>

              {viewingQuote.items && viewingQuote.items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Offerte regels:</span>
                  <div className="space-y-1">
                    {viewingQuote.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-semibold">{formatCurrency(it.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => {
                    toast.success(`Offerte ${viewingQuote.quote_number} gedownload als PDF`);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setViewingQuote(null)}
                  >
                    Sluiten
                  </Button>
                  {viewingQuote.status === 'draft' && (
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5 text-xs"
                      onClick={() => {
                        updateQuote(viewingQuote.id, { status: 'sent' });
                        setViewingQuote({ ...viewingQuote, status: 'sent' });
                        toast.success(`Offerte ${viewingQuote.quote_number} gemarkeerd als verzonden`);
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Versturen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
