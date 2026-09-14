import { useState } from 'react';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function QuotesPage() {
  const { deals } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');

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
        const statusConfig = {
          draft: { variant: 'secondary', icon: Clock },
          sent: { variant: 'default', icon: Send },
          accepted: { variant: 'default', icon: CheckCircle2 },
          rejected: { variant: 'destructive', icon: XCircle },
        };
        const config = statusConfig[row.original.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.variant as any}>
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            {row.original.status === 'draft' && (
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                Send
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

      <DataTable columns={columns} data={filteredQuotes} />
    </div>
  );
}
