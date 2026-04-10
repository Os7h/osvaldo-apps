import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Scale, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";

interface Product {
  id: string;
  name: string;
  size_ml: number;
  empty_weight_g: number;
  full_weight_g: number;
  cost_eur: number;
  sell_price_eur: number;
  category: string;
  supplier: string;
  barcode: string;
}

interface Bottle {
  id: string;
  product_id: string;
  custom_name: string;
  status: string;
  current_weight_g: number;
  bottle_number: number;
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

function statusBadge(status: string) {
  switch (status) {
    case "nueva":
      return <Badge className="bg-green-600 text-white">Neu</Badge>;
    case "aktiv":
      return <Badge className="bg-blue-600 text-white">Aktiv</Badge>;
    case "leer":
      return <Badge className="bg-orange-600 text-white">Leer</Badge>;
    case "terminada":
      return <Badge variant="secondary">Beendet</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function progressColor(pct: number) {
  if (pct < 10) return "bg-destructive";
  if (pct < 20) return "bg-orange-500";
  if (pct < 50) return "bg-yellow-500";
  return "bg-green-500";
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Weight recording
  const [selectedBottleId, setSelectedBottleId] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Add bottle dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBottleName, setNewBottleName] = useState("");

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [prodRes, bottleRes, recRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("bottles").select("*").eq("product_id", id).order("bottle_number"),
        supabase.from("inventory_records").select("*").order("timestamp", { ascending: false }),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (bottleRes.error) throw bottleRes.error;

      setProduct(prodRes.data as Product);
      setBottles((bottleRes.data as Bottle[]) || []);

      // Filter records to only this product's bottles
      const bottleIds = new Set(((bottleRes.data as Bottle[]) || []).map((b) => b.id));
      const filtered = ((recRes.data as InventoryRecord[]) || []).filter((r) =>
        bottleIds.has(r.bottle_id)
      );
      setRecords(filtered);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
      navigate("/pourfect/products");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordWeight = async () => {
    if (!selectedBottleId || !product || newWeight <= 0) return;
    setSaving(true);
    try {
      // Insert inventory record
      const { error: recError } = await supabase.from("inventory_records").insert({
        bottle_id: selectedBottleId,
        weight_g: newWeight,
        measured_by: "demo",
        timestamp: new Date().toISOString(),
      });
      if (recError) throw recError;

      // Calculate liquid to determine status transition
      const { pct } = calcLiquid(newWeight, product);

      // Determine new status
      const bottle = bottles.find((b) => b.id === selectedBottleId);
      let newStatus = bottle?.status || "aktiv";

      if (bottle?.status === "nueva") {
        // First weight → aktiv
        newStatus = "aktiv";
      }
      if (pct < 5) {
        newStatus = "leer";
      }

      // Update bottle weight and status
      const { error: updateError } = await supabase
        .from("bottles")
        .update({ current_weight_g: newWeight, status: newStatus })
        .eq("id", selectedBottleId);
      if (updateError) throw updateError;

      toast({
        title: "Messung gespeichert",
        description: `${bottle?.custom_name}: ${newWeight}g (${pct}% verbleibend)`,
      });

      setSelectedBottleId(null);
      setNewWeight(0);
      await loadData();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkTerminada = async (bottleId: string) => {
    try {
      const { error } = await supabase
        .from("bottles")
        .update({ status: "terminada" })
        .eq("id", bottleId);
      if (error) throw error;
      toast({ title: "Erfolg", description: "Flasche als beendet markiert" });
      await loadData();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    }
  };

  const handleAddBottle = async () => {
    if (!product || !newBottleName.trim()) {
      toast({ variant: "destructive", title: "Fehler", description: "Name ist erforderlich" });
      return;
    }
    try {
      const maxNumber = bottles.reduce((max, b) => Math.max(max, b.bottle_number), 0);
      const { error } = await supabase.from("bottles").insert({
        product_id: product.id,
        custom_name: newBottleName.trim(),
        status: "nueva",
        current_weight_g: product.full_weight_g,
        bottle_number: maxNumber + 1,
      });
      if (error) throw error;
      toast({ title: "Erfolg", description: `${newBottleName} wurde hinzugefügt` });
      setAddDialogOpen(false);
      setNewBottleName("");
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

  if (!product) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Produkt nicht gefunden</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/pourfect/products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground text-sm">
                {product.category} &middot; {product.supplier}
              </p>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Neue Flasche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Flasche hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="bottleName">Bezeichnung</Label>
                  <Input
                    id="bottleName"
                    value={newBottleName}
                    onChange={(e) => setNewBottleName(e.target.value)}
                    placeholder={`z.B. ${product.name} #${bottles.length + 1}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Wird als "nueva" mit Vollgewicht ({product.full_weight_g}g) angelegt.
                </p>
                <Button onClick={handleAddBottle} className="w-full">
                  Flasche hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Produktinformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kapazität</p>
                <p className="text-lg font-semibold">{product.size_ml}ml</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leergewicht</p>
                <p className="text-lg font-semibold">{product.empty_weight_g}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vollgewicht</p>
                <p className="text-lg font-semibold">{product.full_weight_g}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EK-Preis</p>
                <p className="text-lg font-semibold">{product.cost_eur.toFixed(2)} EUR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottles */}
        <Card>
          <CardHeader>
            <CardTitle>Flaschen ({bottles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bottles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Flaschen vorhanden. Fügen Sie eine neue Flasche hinzu.
              </p>
            ) : (
              <div className="space-y-4">
                {bottles.map((bottle) => {
                  const { ml, pct } = calcLiquid(bottle.current_weight_g, product);
                  const isRecording = selectedBottleId === bottle.id;
                  const previewLiquid =
                    isRecording && newWeight > 0
                      ? calcLiquid(newWeight, product)
                      : null;

                  return (
                    <div
                      key={bottle.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isRecording ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold">{bottle.custom_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Flasche #{bottle.bottle_number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge(bottle.status)}
                          {bottle.status === "leer" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkTerminada(bottle.id)}
                              title="Als beendet markieren"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Fill level progress bar — THE KEY FEATURE */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Füllstand</span>
                          <span className="font-semibold">
                            {ml}ml / {product.size_ml}ml ({pct}%)
                          </span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Weight and value info */}
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-semibold">{bottle.current_weight_g}g</div>
                          <div className="text-muted-foreground text-xs">Gewicht</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-semibold text-primary">{ml}ml</div>
                          <div className="text-muted-foreground text-xs">Inhalt</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-semibold text-accent">
                            {((pct / 100) * product.cost_eur).toFixed(2)} EUR
                          </div>
                          <div className="text-muted-foreground text-xs">Wert</div>
                        </div>
                      </div>

                      {/* Record weight section */}
                      {bottle.status !== "terminada" && (
                        <>
                          {!isRecording ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => {
                                setSelectedBottleId(bottle.id);
                                setNewWeight(bottle.current_weight_g);
                              }}
                            >
                              <Scale className="h-4 w-4" />
                              Gewicht erfassen
                            </Button>
                          ) : (
                            <div className="space-y-3 pt-3 border-t border-border">
                              <div>
                                <Label htmlFor={`weight-${bottle.id}`}>
                                  Neues Gewicht (g)
                                </Label>
                                <Input
                                  id={`weight-${bottle.id}`}
                                  type="number"
                                  min={product.empty_weight_g}
                                  max={product.full_weight_g}
                                  value={newWeight || ""}
                                  onChange={(e) => setNewWeight(Number(e.target.value))}
                                />
                              </div>

                              {/* Live preview */}
                              {previewLiquid && (
                                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Vorschau:</span>
                                    <span className="font-semibold">
                                      {previewLiquid.ml}ml ({previewLiquid.pct}%)
                                    </span>
                                  </div>
                                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${progressColor(
                                        previewLiquid.pct
                                      )}`}
                                      style={{ width: `${previewLiquid.pct}%` }}
                                    />
                                  </div>
                                  {previewLiquid.pct < 5 && (
                                    <p className="text-xs text-destructive">
                                      Status wird auf "leer" gesetzt
                                    </p>
                                  )}
                                  {bottle.status === "nueva" && (
                                    <p className="text-xs text-blue-400">
                                      Status wird auf "aktiv" gesetzt
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  onClick={handleRecordWeight}
                                  disabled={saving || newWeight <= 0}
                                  className="flex-1"
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Scale className="h-4 w-4 mr-2" />
                                  )}
                                  Speichern
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBottleId(null);
                                    setNewWeight(0);
                                  }}
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Measurement History */}
        <Card>
          <CardHeader>
            <CardTitle>Messverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Messungen vorhanden
              </p>
            ) : (
              <div className="space-y-2">
                {records.slice(0, 20).map((record) => {
                  const bottle = bottles.find((b) => b.id === record.bottle_id);
                  const { ml, pct } = calcLiquid(record.weight_g, product);
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
                          {new Date(record.timestamp).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{record.weight_g}g</p>
                        <p className="text-sm text-primary">
                          {ml}ml ({pct}%)
                        </p>
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
