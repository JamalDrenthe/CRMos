import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useCRMStore } from '@/stores/crmStore';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function QuotesPage() {
  const { deals } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingQuote, setViewingQuote] = useState<{
    id: string;
    quote_number: string;
    deal_id: string;
    deal_name: string;
    company_name?: string;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    valid_until: string;
    created_at: string;
  } | null>(null);

  // Mock quotes based on deals
  const quotes = deals.slice(0, 5).map((deal, index) => ({
    id: `quote-${index}`,
    quote_number: `QT-2024-${1000 + index}`,
    deal_id: deal.id,
    deal_name: deal.name,
    company_name: deal.company_name,
    total: deal.value,
    status: ['draft', 'sent', 'accepted', 'rejected'][index % 4] as 'draft' | 'sent' | 'accepted' | 'rejected',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: deal.created_at,
  }));

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.quote_number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'deal',
      header: 'Deal',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => (
        <div>
          <p className="font-medium">{row.original.deal_name}</p>
          <p className="text-sm text-muted-foreground">{row.original.company_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => (
        <span className="font-medium">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => {
        const statusConfig: Record<typeof row.original.status, { variant: NonNullable<ComponentProps<typeof Badge>['variant']>; icon: typeof Clock }> = {
          draft: { variant: 'secondary', icon: Clock },
          sent: { variant: 'default', icon: Send },
          accepted: { variant: 'default', icon: CheckCircle2 },
          rejected: { variant: 'destructive', icon: XCircle },
        };
        const config = statusConfig[row.original.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.variant}>
            <Icon className="mr-1 h-3 w-3" />
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => (
        <span>{format(new Date(row.original.valid_until), 'MMM d, yyyy')}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: typeof quotes[0] } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setViewingQuote(row.original)}
              className="gap-2 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Inzien</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.success(`Offerte ${row.original.quote_number} gedownload als PDF`)}
              className="gap-2 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            {row.original.status === 'draft' && (
              <DropdownMenuItem
                onClick={() => toast.success(`Offerte ${row.original.quote_number} verzonden per e-mail`)}
                className="gap-2 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Verzenden</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage quotes and proposals</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Quotes</p>
            <p className="text-2xl font-bold">{quotes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold">
              {quotes.filter((q) => q.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Sent</p>
            <p className="text-2xl font-bold">
              {quotes.filter((q) => q.status === 'sent').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-green-500">
              {quotes.filter((q) => q.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
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

      <DataTable
        columns={columns}
        data={filteredQuotes}
        onRowClick={(row) => setViewingQuote(row)}
      />

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
                  <span className="text-[11px] text-muted-foreground block mb-1">Gekoppelde Deal</span>
                  <p className="font-semibold text-xs truncate">{viewingQuote.deal_name}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Klant / Bedrijf</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {viewingQuote.company_name || 'Geen toewijzing'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Geldig Tot</span>
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {format(new Date(viewingQuote.valid_until), 'd MMM yyyy')}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-card">
                  <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {viewingQuote.status}
                  </Badge>
                </div>
              </div>

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
                    className="rounded-full"
                    onClick={() => setViewingQuote(null)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 text-xs"
                    onClick={() => {
                      toast.success(`Offerte ${viewingQuote.quote_number} verzonden per e-mail`);
                      setViewingQuote(null);
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Versturen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
