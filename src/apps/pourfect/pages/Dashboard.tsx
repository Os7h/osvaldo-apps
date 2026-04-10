import { useState, useEffect } from "react";
import { supabase } from "../db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Droplets, AlertTriangle, Scale, FileBarChart } from "lucide-react";
import Layout from "../components/Layout";
import AppGuide from "@/components/shared/AppGuide";

const guideSteps = [
  { icon: Scale, title: "1. Flaschen wiegen", description: "Klick auf ein Produkt unter \"Produkte\" und gib das aktuelle Gewicht einer Flasche ein. Die App berechnet, wie viel ml noch drin sind." },
  { icon: Droplets, title: "2. Füllstand verfolgen", description: "Jede Flasche hat eine Fortschrittsanzeige — grün ist voll, rot ist fast leer. Der Status wechselt automatisch." },
  { icon: Package, title: "3. Inventar-Snapshots", description: "Unter \"Inventar\" kannst du den aktuellen Bestand als Snapshot speichern und frühere Zustände vergleichen." },
  { icon: FileBarChart, title: "4. Berichte & Export", description: "Unter \"Berichte\" siehst du Verbrauch pro Produkt mit Charts und kannst alles als CSV herunterladen." },
];

interface Product {
  id: string;
  name: string;
  size_ml: number;
  empty_weight_g: number;
  full_weight_g: number;
  cost_eur: number;
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

function calcLiquid(bottle: Bottle, product: Product) {
  if (product.full_weight_g <= product.empty_weight_g) return { ml: 0, pct: 0 };
  const rawMl =
    ((bottle.current_weight_g - product.empty_weight_g) /
      (product.full_weight_g - product.empty_weight_g)) *
    product.size_ml;
  const ml = Math.round(Math.max(0, Math.min(product.size_ml, rawMl)));
  const pct = Math.round((ml / product.size_ml) * 100);
  return { ml, pct };
}

export default function Dashboard() {
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
        supabase.from("products").select("*"),
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const statusCounts = {
    nueva: bottles.filter((b) => b.status === "nueva").length,
    aktiv: bottles.filter((b) => b.status === "aktiv").length,
    leer: bottles.filter((b) => b.status === "leer").length,
    terminada: bottles.filter((b) => b.status === "terminada").length,
  };

  // Calculate total inventory value (only active and new bottles)
  const totalValue = bottles
    .filter((b) => b.status === "aktiv" || b.status === "nueva")
    .reduce((sum, bottle) => {
      const product = products.find((p) => p.id === bottle.product_id);
      if (!product) return sum;
      const { pct } = calcLiquid(bottle, product);
      return sum + (pct / 100) * product.cost_eur;
    }, 0);

  // Low liquid bottles (<20%)
  const lowLiquidBottles = bottles
    .filter((b) => b.status === "aktiv")
    .map((b) => {
      const product = products.find((p) => p.id === b.product_id);
      if (!product) return null;
      const { pct, ml } = calcLiquid(b, product);
      return pct < 20 ? { bottle: b, product, pct, ml } : null;
    })
    .filter(Boolean) as { bottle: Bottle; product: Product; pct: number; ml: number }[];

  // Recent measurements (last 10)
  const recentRecords = records.slice(0, 10);

  return (
    <Layout>
      <AppGuide
        appName="Pourfect"
        tagline="Flaschen-Tracking nach Gewicht"
        intro="Pourfect trackt den Inhalt jeder Flasche anhand ihres Gewichts. Wiege eine Flasche, und die App rechnet aus, wie viele ml noch drin sind. Perfekt für Bars, die ihren Spirituosen-Bestand auf den Milliliter genau kennen wollen. Probier's aus!"
        steps={guideSteps}
        storageKey="pf_guide"
      />
      <div className="space-y-6 mt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Gesamtübersicht aller Spirituosen</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bottles.length}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="default" className="text-xs bg-green-600">{statusCounts.nueva} Neu</Badge>
                <Badge variant="default" className="text-xs bg-blue-600">{statusCounts.aktiv} Aktiv</Badge>
                <Badge variant="default" className="text-xs bg-orange-600">{statusCounts.leer} Leer</Badge>
                <Badge variant="secondary" className="text-xs">{statusCounts.terminada} Beendet</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventarwert</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalValue.toFixed(2)} EUR</div>
              <p className="text-xs text-muted-foreground mt-1">Basierend auf Restmenge</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Niedrig (&lt;20%)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowLiquidBottles.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Flaschen nachbestellen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messungen</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Gewichtsmessungen gesamt</p>
            </CardContent>
          </Card>
        </div>

        {/* Low liquid warnings */}
        {lowLiquidBottles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Niedrige Flaschen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowLiquidBottles.map(({ bottle, product, pct, ml }) => (
                  <div
                    key={bottle.id}
                    className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <div className="font-medium text-sm">{bottle.custom_name}</div>
                    <div className="text-xs text-muted-foreground">{product.name}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-destructive">{pct}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ml}ml verbleibend</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Messungen</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Keine Messungen vorhanden</p>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((record) => {
                  const bottle = bottles.find((b) => b.id === record.bottle_id);
                  const product = bottle
                    ? products.find((p) => p.id === bottle.product_id)
                    : null;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {bottle?.custom_name || "Unbekannt"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product?.name || "–"} &middot;{" "}
                          {new Date(record.timestamp).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{record.weight_g}g</p>
                        <p className="text-xs text-muted-foreground">{record.measured_by}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
