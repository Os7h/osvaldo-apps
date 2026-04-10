import { useState, useEffect, useMemo } from "react";
import { supabase } from "../db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Package, Droplets, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Layout from "../components/Layout";

interface Product {
  id: string;
  name: string;
  size_ml: number;
  empty_weight_g: number;
  full_weight_g: number;
  cost_eur: number;
  category: string;
}

interface Bottle {
  id: string;
  product_id: string;
  custom_name: string;
  status: string;
  current_weight_g: number;
}

interface InventoryRecord {
  id: string;
  bottle_id: string;
  weight_g: number;
  measured_by: string;
  timestamp: string;
}

function calcLiquid(weight: number, product: Product) {
  if (product.full_weight_g <= product.empty_weight_g) return { ml: 0, pct: 0 };
  const rawMl =
    ((weight - product.empty_weight_g) /
      (product.full_weight_g - product.empty_weight_g)) *
    product.size_ml;
  const ml = Math.round(Math.max(0, Math.min(product.size_ml, rawMl)));
  const pct = Math.round((ml / product.size_ml) * 100);
  return { ml, pct };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, bottleRes, recRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("bottles").select("*"),
        supabase.from("inventory_records").select("*").order("timestamp", { ascending: false }),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (bottleRes.error) throw bottleRes.error;
      if (recRes.error) throw recRes.error;
      setProducts((prodRes.data as Product[]) || []);
      setBottles((bottleRes.data as Bottle[]) || []);
      setRecords((recRes.data as InventoryRecord[]) || []);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // Consumption by product (estimated from weight differences in records)
  const consumptionByProduct = useMemo(() => {
    const productConsumption: Record<string, number> = {};

    // Group records by bottle
    const byBottle: Record<string, InventoryRecord[]> = {};
    for (const rec of records) {
      if (!byBottle[rec.bottle_id]) byBottle[rec.bottle_id] = [];
      byBottle[rec.bottle_id].push(rec);
    }

    // For each bottle, compute consumption = first weight - last weight
    for (const [bottleId, recs] of Object.entries(byBottle)) {
      if (recs.length < 2) continue;
      const sorted = [...recs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const bottle = bottles.find((b) => b.id === bottleId);
      if (!bottle) continue;
      const product = products.find((p) => p.id === bottle.product_id);
      if (!product) continue;

      const firstWeight = sorted[0].weight_g;
      const lastWeight = sorted[sorted.length - 1].weight_g;
      const weightDiff = Math.max(0, firstWeight - lastWeight);
      const liquidConsumed =
        (weightDiff / (product.full_weight_g - product.empty_weight_g)) * product.size_ml;

      if (!productConsumption[product.id]) productConsumption[product.id] = 0;
      productConsumption[product.id] += liquidConsumed;
    }

    return products
      .map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
        fullName: p.name,
        consumed_ml: Math.round(productConsumption[p.id] || 0),
      }))
      .filter((x) => x.consumed_ml > 0)
      .sort((a, b) => b.consumed_ml - a.consumed_ml);
  }, [products, bottles, records]);

  // Lifecycle stats
  const lifecycleStats = useMemo(() => {
    const statusCounts = { nueva: 0, aktiv: 0, leer: 0, terminada: 0 };
    for (const b of bottles) {
      if (b.status in statusCounts) {
        statusCounts[b.status as keyof typeof statusCounts]++;
      }
    }
    return statusCounts;
  }, [bottles]);

  // Total value consumed (from terminated and empty bottles)
  const totalValueConsumed = useMemo(() => {
    return bottles
      .filter((b) => b.status === "terminada" || b.status === "leer")
      .reduce((sum, bottle) => {
        const product = products.find((p) => p.id === bottle.product_id);
        return sum + (product?.cost_eur || 0);
      }, 0);
  }, [bottles, products]);

  // Current inventory value
  const currentInventoryValue = useMemo(() => {
    return bottles
      .filter((b) => b.status === "aktiv" || b.status === "nueva")
      .reduce((sum, bottle) => {
        const product = products.find((p) => p.id === bottle.product_id);
        if (!product) return sum;
        const { pct } = calcLiquid(bottle.current_weight_g, product);
        return sum + (pct / 100) * product.cost_eur;
      }, 0);
  }, [bottles, products]);

  // CSV export
  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push("Produkt,Kategorie,Flasche,Status,Gewicht (g),Inhalt (ml),Füllstand (%),Wert (EUR)");

    for (const bottle of bottles) {
      const product = products.find((p) => p.id === bottle.product_id);
      if (!product) continue;
      const { ml, pct } = calcLiquid(bottle.current_weight_g, product);
      const value = ((pct / 100) * product.cost_eur).toFixed(2);
      rows.push(
        `"${product.name}","${product.category}","${bottle.custom_name}","${bottle.status}",${bottle.current_weight_g},${ml},${pct},${value}`
      );
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pourfect_bericht_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exportiert", description: `${bottles.length} Einträge exportiert` });
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
            <h1 className="text-2xl sm:text-3xl font-bold">Berichte</h1>
            <p className="text-muted-foreground text-sm">Verbrauch, Lebenszyklen und Werte</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            CSV exportieren
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{bottles.length}</div>
                <p className="text-sm text-muted-foreground">Flaschen gesamt</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {currentInventoryValue.toFixed(2)} EUR
                </div>
                <p className="text-sm text-muted-foreground">Aktueller Wert</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {totalValueConsumed.toFixed(2)} EUR
                </div>
                <p className="text-sm text-muted-foreground">Verbraucht</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{records.length}</div>
                <p className="text-sm text-muted-foreground">Messungen</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consumption chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Verbrauch nach Produkt (ml)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consumptionByProduct.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nicht genug Messdaten für eine Verbrauchsanalyse
              </p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionByProduct} margin={{ left: 0, right: 0 }}>
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`${value}ml`, "Verbrauch"]}
                    />
                    <Bar dataKey="consumed_ml" radius={[4, 4, 0, 0]}>
                      {consumptionByProduct.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifecycle stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Flaschen-Lebenszyklus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                <div className="text-3xl font-bold text-green-500">{lifecycleStats.nueva}</div>
                <p className="text-sm text-muted-foreground mt-1">Neu</p>
                <p className="text-xs text-muted-foreground">Noch ungeöffnet</p>
              </div>
              <div className="text-center p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                <div className="text-3xl font-bold text-blue-500">{lifecycleStats.aktiv}</div>
                <p className="text-sm text-muted-foreground mt-1">Aktiv</p>
                <p className="text-xs text-muted-foreground">In Benutzung</p>
              </div>
              <div className="text-center p-4 bg-orange-600/10 rounded-lg border border-orange-600/20">
                <div className="text-3xl font-bold text-orange-500">{lifecycleStats.leer}</div>
                <p className="text-sm text-muted-foreground mt-1">Leer</p>
                <p className="text-xs text-muted-foreground">Weniger als 5%</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-3xl font-bold text-muted-foreground">
                  {lifecycleStats.terminada}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Beendet</p>
                <p className="text-xs text-muted-foreground">Archiviert</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value by product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Restwert nach Produkt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products
                .map((product) => {
                  const prodBottles = bottles.filter(
                    (b) =>
                      b.product_id === product.id &&
                      (b.status === "aktiv" || b.status === "nueva")
                  );
                  const totalMl = prodBottles.reduce((sum, b) => {
                    const { ml } = calcLiquid(b.current_weight_g, product);
                    return sum + ml;
                  }, 0);
                  const totalValue = prodBottles.reduce((sum, b) => {
                    const { pct } = calcLiquid(b.current_weight_g, product);
                    return sum + (pct / 100) * product.cost_eur;
                  }, 0);
                  return { product, bottles: prodBottles.length, totalMl, totalValue };
                })
                .filter((x) => x.bottles > 0)
                .sort((a, b) => b.totalValue - a.totalValue)
                .map(({ product, bottles: count, totalMl, totalValue }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} Flasche{count !== 1 ? "n" : ""} &middot; {totalMl}ml
                        verbleibend
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{totalValue.toFixed(2)} EUR</p>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
