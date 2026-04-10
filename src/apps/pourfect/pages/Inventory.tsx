import { useState, useEffect } from "react";
import { supabase } from "../db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, History, Eye } from "lucide-react";
import Layout from "../components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  size_ml: number;
  empty_weight_g: number;
  full_weight_g: number;
}

interface Bottle {
  id: string;
  product_id: string;
  custom_name: string;
  status: string;
  current_weight_g: number;
  bottle_number: number;
}

interface Snapshot {
  id: string;
  name: string;
  created_at: string;
}

interface SnapshotEntry {
  id: string;
  snapshot_id: string;
  bottle_id: string;
  weight_g: number;
  liquid_ml: number;
  liquid_pct: number;
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

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotEntries, setSnapshotEntries] = useState<SnapshotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [viewingSnapshotId, setViewingSnapshotId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, bottleRes, snapRes, entryRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("bottles").select("*").order("custom_name"),
        supabase.from("inventory_snapshots").select("*").order("created_at", { ascending: false }),
        supabase.from("snapshot_entries").select("*"),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (bottleRes.error) throw bottleRes.error;
      if (snapRes.error) throw snapRes.error;
      if (entryRes.error) throw entryRes.error;

      setProducts((prodRes.data as Product[]) || []);
      setBottles((bottleRes.data as Bottle[]) || []);
      setSnapshots((snapRes.data as Snapshot[]) || []);
      setSnapshotEntries((entryRes.data as SnapshotEntry[]) || []);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!snapshotName.trim()) {
      toast({ variant: "destructive", title: "Fehler", description: "Name ist erforderlich" });
      return;
    }
    setTakingSnapshot(true);
    try {
      const snapshotId = `snap${Date.now()}`;
      const { error: snapError } = await supabase.from("inventory_snapshots").insert({
        id: snapshotId,
        name: snapshotName.trim(),
        created_at: new Date().toISOString(),
      });
      if (snapError) throw snapError;

      // Save current state of all active bottles
      const activeBottles = bottles.filter((b) => b.status === "aktiv" || b.status === "nueva");
      for (const bottle of activeBottles) {
        const product = products.find((p) => p.id === bottle.product_id);
        if (!product) continue;
        const { ml, pct } = calcLiquid(bottle.current_weight_g, product);

        const { error: entryError } = await supabase.from("snapshot_entries").insert({
          snapshot_id: snapshotId,
          bottle_id: bottle.id,
          weight_g: bottle.current_weight_g,
          liquid_ml: ml,
          liquid_pct: pct,
        });
        if (entryError) throw entryError;
      }

      toast({
        title: "Snapshot gespeichert",
        description: `"${snapshotName}" mit ${activeBottles.length} Flaschen`,
      });
      setSnapshotName("");
      await loadData();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally {
      setTakingSnapshot(false);
    }
  };

  const getSnapshotEntries = (snapshotId: string) => {
    return snapshotEntries.filter((e) => e.snapshot_id === snapshotId);
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

  const activeBottles = bottles.filter((b) => b.status === "aktiv" || b.status === "nueva");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Inventar</h1>
          <p className="text-muted-foreground text-sm">
            Aktueller Bestand und Inventur-Snapshots
          </p>
        </div>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Aktueller Bestand
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Snapshots ({snapshots.length})
            </TabsTrigger>
          </TabsList>

          {/* Current inventory */}
          <TabsContent value="current" className="space-y-4">
            {/* Take snapshot */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="snapName">Snapshot-Name</Label>
                    <Input
                      id="snapName"
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      placeholder="z.B. Wocheninventur KW15"
                    />
                  </div>
                  <Button
                    onClick={handleTakeSnapshot}
                    disabled={takingSnapshot || !snapshotName.trim()}
                    className="gap-2 self-end"
                  >
                    {takingSnapshot ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    Snapshot aufnehmen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Speichert den aktuellen Zustand aller {activeBottles.length} aktiven Flaschen.
                </p>
              </CardContent>
            </Card>

            {/* Current bottles table */}
            <Card>
              <CardHeader>
                <CardTitle>Alle Flaschen ({bottles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-3">
                    {bottles.map((bottle) => {
                      const product = products.find((p) => p.id === bottle.product_id);
                      const liquid = product
                        ? calcLiquid(bottle.current_weight_g, product)
                        : { ml: 0, pct: 0 };
                      return (
                        <Card key={bottle.id}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">{bottle.custom_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product?.name || "–"}
                                </p>
                              </div>
                              <StatusBadge status={bottle.status} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-center">
                              <div className="p-1 bg-muted/50 rounded">
                                <div className="font-semibold">{bottle.current_weight_g}g</div>
                                <div className="text-muted-foreground">Gewicht</div>
                              </div>
                              <div className="p-1 bg-muted/50 rounded">
                                <div className="font-semibold text-primary">{liquid.ml}ml</div>
                                <div className="text-muted-foreground">Inhalt</div>
                              </div>
                              <div className="p-1 bg-muted/50 rounded">
                                <div className="font-semibold">{liquid.pct}%</div>
                                <div className="text-muted-foreground">Füllstand</div>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  liquid.pct < 10
                                    ? "bg-destructive"
                                    : liquid.pct < 20
                                    ? "bg-orange-500"
                                    : liquid.pct < 50
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${liquid.pct}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Flasche</TableHead>
                          <TableHead>Produkt</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Gewicht</TableHead>
                          <TableHead className="text-right">Inhalt</TableHead>
                          <TableHead className="text-right">Füllstand</TableHead>
                          <TableHead className="w-[200px]">Füllstand</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bottles.map((bottle) => {
                          const product = products.find((p) => p.id === bottle.product_id);
                          const liquid = product
                            ? calcLiquid(bottle.current_weight_g, product)
                            : { ml: 0, pct: 0 };
                          return (
                            <TableRow key={bottle.id}>
                              <TableCell className="font-medium">{bottle.custom_name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {product?.name || "–"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={bottle.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                {bottle.current_weight_g}g
                              </TableCell>
                              <TableCell className="text-right text-primary font-medium">
                                {liquid.ml}ml
                              </TableCell>
                              <TableCell className="text-right">{liquid.pct}%</TableCell>
                              <TableCell>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      liquid.pct < 10
                                        ? "bg-destructive"
                                        : liquid.pct < 20
                                        ? "bg-orange-500"
                                        : liquid.pct < 50
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{ width: `${liquid.pct}%` }}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Snapshots */}
          <TabsContent value="snapshots" className="space-y-4">
            {snapshots.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Noch keine Snapshots vorhanden</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Wechseln Sie zum Tab "Aktueller Bestand" um einen Snapshot aufzunehmen.
                  </p>
                </CardContent>
              </Card>
            ) : (
              snapshots.map((snapshot) => {
                const entries = getSnapshotEntries(snapshot.id);
                const isViewing = viewingSnapshotId === snapshot.id;
                return (
                  <Card key={snapshot.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{snapshot.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(snapshot.created_at).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" "}
                            &middot; {entries.length} Flaschen
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            setViewingSnapshotId(isViewing ? null : snapshot.id)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          {isViewing ? "Ausblenden" : "Anzeigen"}
                        </Button>
                      </div>
                    </CardHeader>
                    {isViewing && (
                      <CardContent>
                        <div className="space-y-2">
                          {entries.map((entry) => {
                            const bottle = bottles.find((b) => b.id === entry.bottle_id);
                            const product = bottle
                              ? products.find((p) => p.id === bottle.product_id)
                              : null;
                            return (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                              >
                                <div>
                                  <p className="font-medium text-sm">
                                    {bottle?.custom_name || "Unbekannt"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {product?.name || "–"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-semibold">{entry.weight_g}g</p>
                                    <p className="text-sm text-primary">
                                      {entry.liquid_ml}ml ({entry.liquid_pct}%)
                                    </p>
                                  </div>
                                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        entry.liquid_pct < 10
                                          ? "bg-destructive"
                                          : entry.liquid_pct < 20
                                          ? "bg-orange-500"
                                          : entry.liquid_pct < 50
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                      }`}
                                      style={{ width: `${entry.liquid_pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "nueva":
      return <Badge className="bg-green-600 text-white text-xs">Neu</Badge>;
    case "aktiv":
      return <Badge className="bg-blue-600 text-white text-xs">Aktiv</Badge>;
    case "leer":
      return <Badge className="bg-orange-600 text-white text-xs">Leer</Badge>;
    case "terminada":
      return <Badge variant="secondary" className="text-xs">Beendet</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}
