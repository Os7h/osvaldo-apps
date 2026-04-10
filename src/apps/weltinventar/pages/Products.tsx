import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WeltInventarLayout from "../components/Layout";
import { supabase } from "../db";

interface Product {
  id: string;
  name: string;
  barcode: string;
  cost_price: number;
  sell_price: number;
  unit_type: string;
  category_id: string;
  is_active: boolean;
  description: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface StockEntry {
  id: string;
  product_id: string;
  current_quantity: number;
  min_threshold: number;
  location: string;
}

const emptyForm = {
  name: "",
  barcode: "",
  cost_price: "",
  sell_price: "",
  unit_type: "count",
  category_id: "",
  description: "",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select()
        .eq("is_active", true)
        .order("name");
      const { data: cats } = await supabase.from("categories").select().order("sort_order");
      const { data: stocks } = await supabase.from("stock_entries").select();

      setProducts((prods as Product[]) || []);
      setCategories((cats as Category[]) || []);
      setStockEntries((stocks as StockEntry[]) || []);
    } catch (err: unknown) {
      console.error("Produkte laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStock = (productId: string) =>
    stockEntries.find((s) => s.product_id === productId);

  const getCategory = (categoryId: string) =>
    categories.find((c) => c.id === categoryId);

  const getUnitLabel = (unitType: string) => {
    if (unitType === "weight") return "g";
    if (unitType === "volume") return "ml";
    return "St.";
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      barcode: product.barcode,
      cost_price: String(product.cost_price),
      sell_price: String(product.sell_price),
      unit_type: product.unit_type,
      category_id: product.category_id,
      description: product.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.barcode || !form.category_id) {
      toast({
        title: "Fehler",
        description: "Name, Barcode und Kategorie sind Pflichtfelder.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: form.name,
        barcode: form.barcode,
        cost_price: parseFloat(form.cost_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
        unit_type: form.unit_type,
        category_id: form.category_id,
        description: form.description,
        is_active: true,
      };

      if (editingId) {
        await supabase.from("products").update(productData).eq("id", editingId);
        toast({ title: "Produkt aktualisiert", description: `${form.name} wurde gespeichert.` });
      } else {
        const { data: inserted } = await supabase
          .from("products")
          .insert(productData)
          .single();

        // Create a stock entry for the new product
        if (inserted) {
          await supabase.from("stock_entries").insert({
            product_id: (inserted as Record<string, unknown>).id,
            current_quantity: 0,
            min_threshold: 5,
            location: "Hauptlager",
          });
        }

        toast({ title: "Produkt erstellt", description: `${form.name} wurde hinzugefügt.` });
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      loadData();
    } catch (err: unknown) {
      toast({
        title: "Fehler",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await supabase.from("products").update({ is_active: false }).eq("id", product.id);
      toast({ title: "Produkt gelöscht", description: `${product.name} wurde entfernt.` });
      loadData();
    } catch (err: unknown) {
      toast({
        title: "Fehler",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produkte</h1>
            <p className="text-muted-foreground">
              {products.length} aktive Artikel verwalten
            </p>
          </div>
          <Button onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            Produkt hinzufügen
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name, Barcode oder Beschreibung suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Lade Produkte...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Produkte gefunden</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== "all"
                ? "Versuchen Sie, Ihre Suche oder Filter anzupassen"
                : "Beginnen Sie mit der Erstellung Ihres ersten Produkts"}
            </p>
            <Button onClick={openAddForm} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Erstes Produkt hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const stock = getStock(product.id);
              const category = getCategory(product.category_id);
              const isLowStock =
                stock && stock.current_quantity <= stock.min_threshold;

              return (
                <Card key={product.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {product.name}
                        </CardTitle>
                        {category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.icon} {category.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditForm(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span>EAN: {product.barcode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">EK:</span>{" "}
                        <span className="font-medium">
                          €{product.cost_price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">VK:</span>{" "}
                        <span className="font-medium">
                          €{product.sell_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {stock && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Bestand: {stock.current_quantity} {getUnitLabel(product.unit_type)}
                        </span>
                        <Badge variant={isLowStock ? "destructive" : "secondary"}>
                          {isLowStock ? "Niedrig" : "OK"}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Produkt bearbeiten" : "Neues Produkt"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Ändern Sie die Produktdaten"
                  : "Geben Sie die Produktdaten ein"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Produktname"
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode (EAN-13) *</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="4000000000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Einkaufspreis (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verkaufspreis (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.sell_price}
                    onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Einheit</Label>
                  <Select
                    value={form.unit_type}
                    onValueChange={(v) => v && setForm({ ...form, unit_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Stück</SelectItem>
                      <SelectItem value="weight">Gewicht (g)</SelectItem>
                      <SelectItem value="volume">Volumen (ml)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategorie *</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => v && setForm({ ...form, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Kurze Beschreibung"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editingId ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </WeltInventarLayout>
  );
}
