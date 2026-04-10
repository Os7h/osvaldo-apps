import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search } from "lucide-react";
import Layout from "../components/Layout";

interface Product {
  id: string;
  name: string;
  size_ml: number;
  empty_weight_g: number;
  full_weight_g: number;
  cost_eur: number;
  sell_price_eur: number;
  barcode: string;
  category: string;
  supplier: string;
}

interface Bottle {
  id: string;
  product_id: string;
  status: string;
  current_weight_g: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: "", size_ml: 700, empty_weight_g: 450, full_weight_g: 1150,
    cost_eur: 15, sell_price_eur: 5, barcode: "", category: "", supplier: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, bottleRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("bottles").select("*"),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (bottleRes.error) throw bottleRes.error;
      setProducts((prodRes.data as Product[]) || []);
      setBottles((bottleRes.data as Bottle[]) || []);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const getBottleSummary = (productId: string) => {
    const prodBottles = bottles.filter((b) => b.product_id === productId);
    return {
      total: prodBottles.length,
      aktiv: prodBottles.filter((b) => b.status === "aktiv").length,
      nueva: prodBottles.filter((b) => b.status === "nueva").length,
      leer: prodBottles.filter((b) => b.status === "leer").length,
    };
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast({ variant: "destructive", title: "Fehler", description: "Name und Kategorie sind Pflichtfelder" });
      return;
    }
    try {
      const { error } = await supabase.from("products").insert({
        ...newProduct,
        id: `p${Date.now()}`,
      });
      if (error) throw error;
      toast({ title: "Erfolg", description: `${newProduct.name} wurde hinzugefügt` });
      setDialogOpen(false);
      setNewProduct({
        name: "", size_ml: 700, empty_weight_g: 450, full_weight_g: 1150,
        cost_eur: 15, sell_price_eur: 5, barcode: "", category: "", supplier: "",
      });
      await loadData();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Produktkatalog</h1>
            <p className="text-muted-foreground text-sm">{products.length} Produkte registriert</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Neues Produkt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neues Produkt hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategorie *</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="z.B. Vodka, Gin, Rum..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="size_ml">Größe (ml)</Label>
                    <Input
                      id="size_ml"
                      type="number"
                      value={newProduct.size_ml}
                      onChange={(e) => setNewProduct({ ...newProduct, size_ml: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="empty_weight">Leergewicht (g)</Label>
                    <Input
                      id="empty_weight"
                      type="number"
                      value={newProduct.empty_weight_g}
                      onChange={(e) => setNewProduct({ ...newProduct, empty_weight_g: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_weight">Vollgewicht (g)</Label>
                    <Input
                      id="full_weight"
                      type="number"
                      value={newProduct.full_weight_g}
                      onChange={(e) => setNewProduct({ ...newProduct, full_weight_g: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Einkaufspreis (EUR)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={newProduct.cost_eur}
                      onChange={(e) => setNewProduct({ ...newProduct, cost_eur: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sell">Verkaufspreis (EUR)</Label>
                    <Input
                      id="sell"
                      type="number"
                      step="0.01"
                      value={newProduct.sell_price_eur}
                      onChange={(e) => setNewProduct({ ...newProduct, sell_price_eur: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Lieferant</Label>
                    <Input
                      id="supplier"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="w-full mt-2">
                  Produkt hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Name, Kategorie, Lieferant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const summary = getBottleSummary(product.id);
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.supplier}</p>
                    </div>
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Bottle summary */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Flaschen:</span>
                      <div className="flex gap-1">
                        {summary.nueva > 0 && (
                          <Badge className="text-xs bg-green-600">{summary.nueva} neu</Badge>
                        )}
                        {summary.aktiv > 0 && (
                          <Badge className="text-xs bg-blue-600">{summary.aktiv} aktiv</Badge>
                        )}
                        {summary.leer > 0 && (
                          <Badge className="text-xs bg-orange-600">{summary.leer} leer</Badge>
                        )}
                        {summary.total === 0 && (
                          <Badge variant="outline" className="text-xs">Keine</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Größe:</span>
                      <p className="font-medium">{product.size_ml}ml</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">EK-Preis:</span>
                      <p className="font-medium">{product.cost_eur.toFixed(2)} EUR</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leergewicht:</span>
                      <p className="font-medium">{product.empty_weight_g}g</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vollgewicht:</span>
                      <p className="font-medium">{product.full_weight_g}g</p>
                    </div>
                  </div>

                  {product.barcode && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Barcode:</span>
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                        {product.barcode}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to={`/pourfect/products/${product.id}`}
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Details anzeigen &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Keine Produkte gefunden</p>
              <p className="text-sm text-muted-foreground mt-2">
                Versuchen Sie, die Suchfilter zu ändern
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
