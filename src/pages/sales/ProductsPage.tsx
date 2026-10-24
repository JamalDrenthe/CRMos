import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';
import type { Product } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Package,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ProductsPage() {
  const { organization } = useAuthStore();
  const orgId = organization?.id || 'default_org';
  const defaultProducts: Product[] = [
    {
      id: 'prod_1',
      name: 'CRMos Pro Bedrijfslicentie (Jaarlijks)',
      sku: 'SKU-CRM-01',
      price: 2400,
      currency: 'EUR',
      category: 'Software Licentie',
      description: 'Volledige toegang tot CRM, D2D Field Sales kaarten en Telemarketing workspaces.',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      name: 'D2D Buitendienst Tablet & Kaartsuite',
      sku: 'SKU-D2D-HW',
      price: 650,
      currency: 'EUR',
      category: 'Hardware & Tools',
      description: 'Geoptimaliseerde veldtablet met offline BAG Kadaster data en Salesdock contract-app.',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      name: 'Contact Center Beller Seat (Maandelijks)',
      sku: 'SKU-CC-SEAT',
      price: 120,
      currency: 'EUR',
      category: 'Telemarketing',
      description: 'Inclusief Twilio Voice integratie, automatische disposition-logging en Pitch Flows.',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    category: 'Subscription',
    description: '',
  });

  useEffect(() => {
    const unsub = subscribeToProducts(orgId, (items) => {
      if (items && items.length > 0) {
        setProducts(items);
      }
    });
    return () => unsub();
  }, [orgId]);

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      toast.error('Vul een productnaam in');
      return;
    }
    const product: Product = {
      id: `prod_${Math.random().toString(36).substring(2, 10)}`,
      name: newProduct.name.trim(),
      sku: newProduct.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      price: Number(newProduct.price) || 0,
      currency: 'EUR',
      category: newProduct.category || 'Algemeen',
      description: newProduct.description,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    await saveProductToFirestore(product, orgId);
    toast.success('Product opgeslagen in Firestore');
    setIsAddOpen(false);
    setNewProduct({ name: '', sku: '', price: '', category: 'Subscription', description: '' });
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProductFromFirestore(id);
    toast.success('Product verwijderd');
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0;

  const columns = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }: { row: { original: Product } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categorie',
      cell: ({ row }: { row: { original: Product } }) => (
        <Badge variant="outline">{row.original.category || 'Algemeen'}</Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Prijs',
      cell: ({ row }: { row: { original: Product } }) => (
        <span className="font-medium">{formatCurrency(row.original.price)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Product } }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Actief' : 'Inactief'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Product } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteProduct(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Producten</h1>
          <p className="text-muted-foreground">Beheer je productcatalogus (gesynchroniseerd met HubSpot &amp; Firestore)</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Product Toevoegen
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totaal Producten</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actief</p>
            <p className="text-2xl font-bold text-green-500">
              {products.filter((p) => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categorieën</p>
            <p className="text-2xl font-bold">
              {new Set(products.map((p) => p.category)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gemiddelde Prijs</p>
            <p className="text-2xl font-bold">{formatCurrency(avgPrice)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek producten..."
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

      <DataTable columns={columns} data={filteredProducts} />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Product Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Productnaam</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Bijv. CRMos Enterprise Licentie"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="ENT-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prijs (€)</Label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Input
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="Subscription / Service"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddProduct}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
