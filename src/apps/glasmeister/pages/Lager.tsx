import { useState, useEffect } from "react";
import { supabase } from "../db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, AlertTriangle, RotateCcw, Bell } from "lucide-react";
import Layout from "../components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Glass {
  id: string;
  category: string;
  name: string;
  missing: number;
  storage_count: number;
  reorder_threshold: number;
  bar_target: number;
  bar_count: number;
}

const Lager = () => {
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [selectedGlass, setSelectedGlass] = useState<string>("");
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [resetting, setResetting] = useState(false);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => { loadGlasses(); }, []);

  const loadGlasses = async () => {
    try {
      const { data, error } = await supabase
        .from("glasses").select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      setGlasses(data || []);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler beim Laden", description: (error as Error).message });
    } finally { setLoading(false); }
  };

  const refillGlass = async (glass: Glass) => {
    if (glass.storage_count === 0) {
      toast({ variant: "destructive", title: "Kein Lagerbestand", description: `Es gibt keine ${glass.name} im Lager.` });
      return;
    }
    setProcessing(glass.id);
    try {
      const amountToTake = Math.min(glass.missing, glass.storage_count);
      const newStorageCount = glass.storage_count - amountToTake;
      const newMissing = glass.missing - amountToTake;
      await supabase.from("glasses").update({ storage_count: newStorageCount, missing: newMissing }).eq("id", glass.id);
      await supabase.from("inventory_history").insert({ glass_id: glass.id, bar_count: 0, storage_count: newStorageCount, missing: newMissing });
      const message = amountToTake < glass.missing
        ? `${amountToTake} ${glass.name} aus dem Lager geholt. Noch ${newMissing} fehlen.`
        : `${amountToTake} ${glass.name} aus dem Lager geholt.`;
      toast({ title: "Lager aktualisiert", description: message, variant: newMissing > 0 ? "destructive" : "default" });
      if (newStorageCount <= glass.reorder_threshold) {
        toast({ title: "Bestellerinnerung", description: `${glass.name} ist unter der Nachbestell-Schwelle (${newStorageCount}/${glass.reorder_threshold}).` });
      }
      await loadGlasses();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler beim Auffüllen", description: (error as Error).message });
    } finally { setProcessing(null); }
  };

  const handleWithdrawal = async () => {
    if (!selectedGlass || withdrawAmount <= 0) {
      toast({ variant: "destructive", title: "Ungültige Eingabe", description: "Bitte wählen Sie ein Glas und geben Sie eine Menge ein." });
      return;
    }
    const glass = glasses.find(g => g.id === selectedGlass);
    if (!glass) return;
    if (withdrawAmount > glass.storage_count) {
      toast({ variant: "destructive", title: "Nicht genug im Lager", description: `Nur ${glass.storage_count} ${glass.name} verfügbar.` });
      return;
    }
    setProcessing(selectedGlass);
    try {
      const newStorageCount = glass.storage_count - withdrawAmount;
      await supabase.from("glasses").update({ storage_count: newStorageCount }).eq("id", selectedGlass);
      toast({ title: "Entnahme erfolgreich", description: `${withdrawAmount} ${glass.name}-Gläser wurden entnommen.` });
      setWithdrawAmount(0);
      setSelectedGlass("");
      await loadGlasses();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler bei der Entnahme", description: (error as Error).message });
    } finally { setProcessing(null); }
  };

  const startEditingStock = (glass: Glass) => { setEditingStock(glass.id); setNewStockValue(glass.storage_count); };
  const cancelEditingStock = () => { setEditingStock(null); setNewStockValue(0); };

  const updateStock = async (glassId: string) => {
    if (newStockValue < 0) { toast({ variant: "destructive", title: "Ungültig", description: "Bestand kann nicht negativ sein." }); return; }
    setProcessing(glassId);
    try {
      await supabase.from("glasses").update({ storage_count: newStockValue }).eq("id", glassId);
      const glass = glasses.find(g => g.id === glassId);
      toast({ title: "Lagerbestand aktualisiert", description: `${glass?.name}: ${newStockValue} Stück` });
      setEditingStock(null);
      await loadGlasses();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler", description: (error as Error).message });
    } finally { setProcessing(null); }
  };

  const resetAllGlasses = async () => {
    setResetting(true);
    try {
      for (const glass of glasses) {
        const newStorageCount = Math.max(0, glass.storage_count - glass.missing);
        await supabase.from("glasses").update({ missing: 0, bar_count: glass.bar_target, storage_count: newStorageCount }).eq("id", glass.id);
        await supabase.from("inventory_history").insert({ glass_id: glass.id, bar_count: glass.bar_target, storage_count: newStorageCount, missing: 0 });
      }
      toast({ title: "Reset erfolgreich", description: "Alle Gläser wurden aus dem Lager aufgefüllt." });
      await loadGlasses();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler beim Reset", description: (error as Error).message });
    } finally { setResetting(false); }
  };

  const sendExtraAlert = async (glass: Glass) => {
    setSendingAlert(glass.id);
    toast({ title: "Erinnerung gesendet", description: `Bestellerinnerung für ${glass.name} (${glass.storage_count}/${glass.reorder_threshold}).` });
    await supabase.from("inventory_history").insert({ glass_id: glass.id, bar_count: glass.bar_count, storage_count: glass.storage_count, missing: glass.missing });
    setSendingAlert(null);
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const glassesNeedingRefill = glasses.filter(g => g.missing > 0);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        {/* Section 1: Refill needed */}
        {glassesNeedingRefill.length > 0 && (
          <Card className="shadow-lg md:shadow-xl border-destructive/50 overflow-hidden">
            <CardHeader className="space-y-3 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <CardTitle className="text-lg md:text-3xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 md:h-7 md:w-7 text-destructive flex-shrink-0" />
                    <span className="leading-tight truncate">Auffüllen</span>
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Gläser aus dem Lager auffüllen</CardDescription>
                </div>
                <Button onClick={resetAllGlasses} disabled={resetting || processing !== null} variant="outline" size="sm" className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  <span className="truncate">{isMobile ? "Reset" : "Alles zurücksetzen"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isMobile ? (
                <div className="space-y-3">
                  {glassesNeedingRefill.map((glass) => (
                    <Card key={glass.id} className="border-destructive/30 overflow-hidden">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground truncate">{glass.category}</p>
                            <p className="font-semibold text-sm truncate">{glass.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Fehlt</p>
                            <p className="font-bold text-destructive text-base">{glass.missing}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-2 pt-2 border-t">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Lager</p>
                            <p className={`font-bold text-sm ${glass.storage_count <= 10 ? 'text-destructive' : ''}`}>{glass.storage_count}</p>
                          </div>
                          <Button onClick={() => refillGlass(glass)} disabled={processing === glass.id || glass.storage_count === 0} size="sm" variant={glass.storage_count === 0 ? "destructive" : "default"} className="shrink-0">
                            {processing === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : glass.storage_count === 0 ? "Leer" : <Package className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Kategorie</TableHead>
                      <TableHead className="font-bold">Glas</TableHead>
                      <TableHead className="font-bold text-center">Fehlend</TableHead>
                      <TableHead className="font-bold text-center">Lagerbestand</TableHead>
                      <TableHead className="font-bold text-center">Aktion</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {glassesNeedingRefill.map((glass) => (
                        <TableRow key={glass.id}>
                          <TableCell className="font-medium">{glass.category}</TableCell>
                          <TableCell>{glass.name}</TableCell>
                          <TableCell className="text-center"><span className="font-bold text-destructive">{glass.missing}</span></TableCell>
                          <TableCell className="text-center"><span className={`font-bold ${glass.storage_count <= 10 ? 'text-destructive' : 'text-muted-foreground'}`}>{glass.storage_count}</span></TableCell>
                          <TableCell className="text-center">
                            <Button onClick={() => refillGlass(glass)} disabled={processing === glass.id || glass.storage_count === 0} size="sm" variant={glass.storage_count === 0 ? "destructive" : "default"}>
                              {processing === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : glass.storage_count === 0 ? "Kein Lagerbestand" : glass.storage_count < glass.missing ? `Teilweise (${glass.storage_count})` : "Aufgefüllt"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 2: Full inventory overview */}
        <Card className="shadow-lg md:shadow-xl overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg md:text-3xl flex items-center gap-2">
              <Package className="h-4 w-4 md:h-7 md:w-7 flex-shrink-0" />
              <span className="leading-tight truncate">Lagerbestand</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {isMobile ? "Übersicht aller Gläser" : "Übersicht aller Gläser mit aktuellem Lagerbestand. Klicken Sie auf \"Bearbeiten\" um den Bestand anzupassen."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isMobile ? (
              <div className="space-y-3">
                {glasses.map((glass) => (
                  <Card key={glass.id} className={`overflow-hidden ${glass.storage_count <= glass.reorder_threshold ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <CardContent className="p-3 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{glass.category}</p>
                          <p className="font-semibold text-sm truncate">{glass.name}</p>
                        </div>
                        {glass.storage_count <= glass.reorder_threshold && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />}
                      </div>
                      {editingStock === glass.id ? (
                        <div className="space-y-2 pt-2 border-t">
                          <div>
                            <Label className="text-xs">Bestand</Label>
                            <Input type="number" min="0" value={newStockValue} onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)} className="mt-1" autoFocus />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => updateStock(glass.id)} disabled={processing === glass.id} size="sm" className="w-full">
                              {processing === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
                            </Button>
                            <Button onClick={cancelEditingStock} disabled={processing === glass.id} size="sm" variant="outline" className="w-full">Abbrechen</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2 pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Lager</span>
                              <span className={`font-bold text-sm ${glass.storage_count <= glass.reorder_threshold ? 'text-destructive' : ''}`}>{glass.storage_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Schwelle</span>
                              <span className="font-medium text-sm text-muted-foreground">{glass.reorder_threshold}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 pt-2">
                            <Button onClick={() => startEditingStock(glass)} disabled={processing !== null || resetting} size="sm" variant="outline" className="w-full">Bearbeiten</Button>
                            {glass.storage_count <= glass.reorder_threshold && (
                              <Button onClick={() => sendExtraAlert(glass)} disabled={sendingAlert === glass.id || processing !== null} size="sm" variant="secondary" className="w-full flex items-center justify-center gap-2">
                                {sendingAlert === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="h-4 w-4" /><span>Erinnerung</span></>}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Kategorie</TableHead>
                    <TableHead className="font-bold">Glas</TableHead>
                    <TableHead className="font-bold text-center">Lagerbestand</TableHead>
                    <TableHead className="font-bold text-center">Nachbestell-Schwelle</TableHead>
                    <TableHead className="font-bold text-center">Aktionen</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {glasses.map((glass) => (
                      <TableRow key={glass.id} className={glass.storage_count <= glass.reorder_threshold ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{glass.category}</TableCell>
                        <TableCell>{glass.name}</TableCell>
                        <TableCell className="text-center">
                          {editingStock === glass.id ? (
                            <Input type="number" min="0" value={newStockValue} onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)} className="w-24 mx-auto" autoFocus />
                          ) : (
                            <span className={`font-bold ${glass.storage_count <= glass.reorder_threshold ? 'text-destructive' : 'text-foreground'}`}>{glass.storage_count}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{glass.reorder_threshold}</TableCell>
                        <TableCell className="text-center">
                          {editingStock === glass.id ? (
                            <div className="flex gap-2 justify-center">
                              <Button onClick={() => updateStock(glass.id)} disabled={processing === glass.id} size="sm">{processing === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}</Button>
                              <Button onClick={cancelEditingStock} disabled={processing === glass.id} size="sm" variant="outline">Abbrechen</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <Button onClick={() => startEditingStock(glass)} disabled={processing !== null || resetting} size="sm" variant="outline">Bearbeiten</Button>
                              {glass.storage_count <= glass.reorder_threshold && (
                                <Button onClick={() => sendExtraAlert(glass)} disabled={sendingAlert === glass.id || processing !== null} size="sm" variant="secondary" title="Bestellerinnerung">
                                  {sendingAlert === glass.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Withdrawal */}
        <Card className="shadow-lg md:shadow-xl overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg md:text-2xl leading-tight">Entnahme</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {isMobile ? "Gläser aus dem Lager entnehmen" : "Für Events können Sie Gläser direkt aus dem Lager entnehmen."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="glass-select" className="text-xs">Glas</Label>
                <select id="glass-select" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={selectedGlass} onChange={(e) => setSelectedGlass(e.target.value)}>
                  <option value="">-- Bitte wählen --</option>
                  {glasses.map((glass) => (<option key={glass.id} value={glass.id}>{glass.name} ({glass.storage_count})</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount" className="text-xs">Anzahl</Label>
                <Input id="withdraw-amount" type="number" min="1" value={withdrawAmount || ""} onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)} placeholder="Anzahl" />
              </div>
              <Button onClick={handleWithdrawal} disabled={!selectedGlass || withdrawAmount <= 0 || processing !== null} className="w-full">
                {processing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Wird entnommen...</span></>) : (<><AlertTriangle className="mr-2 h-4 w-4" /><span>Entnehmen</span></>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Lager;
