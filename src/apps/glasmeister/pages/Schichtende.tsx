import { useState, useEffect } from "react";
import { supabase } from "../db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RotateCcw } from "lucide-react";
import Layout from "../components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Glass {
  id: string;
  category: string;
  name: string;
  bar_target: number;
  bar_count: number;
  missing: number;
}

const Schichtende = () => {
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadGlasses();
  }, []);

  const loadGlasses = async () => {
    try {
      const { data, error } = await supabase
        .from("glasses")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setGlasses(data || []);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler beim Laden",
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBarCount = (id: string, newCount: number) => {
    setGlasses(glasses.map(glass => {
      if (glass.id === id) {
        const missing = Math.max(0, glass.bar_target - newCount);
        return { ...glass, bar_count: newCount, missing };
      }
      return glass;
    }));
  };

  const saveInventory = async () => {
    setSaving(true);
    try {
      for (const glass of glasses) {
        await supabase
          .from("glasses")
          .update({ bar_count: glass.bar_count, missing: glass.missing })
          .eq("id", glass.id);

        await supabase
          .from("inventory_history")
          .insert({
            glass_id: glass.id,
            bar_count: glass.bar_count,
            storage_count: 0,
            missing: glass.missing,
          });
      }

      const missingGlasses = glasses.filter(g => g.missing > 0);
      toast({
        title: "Inventur gespeichert",
        description: missingGlasses.length > 0
          ? `${missingGlasses.length} Gläser-Typen müssen aus dem Lager geholt werden.`
          : "Alle Gläser sind vollständig!",
      });

      await loadGlasses();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetAllGlasses = async () => {
    setResetting(true);
    try {
      for (const glass of glasses) {
        await supabase
          .from("glasses")
          .update({ missing: 0, bar_count: glass.bar_target })
          .eq("id", glass.id);

        await supabase
          .from("inventory_history")
          .insert({
            glass_id: glass.id,
            bar_count: glass.bar_target,
            storage_count: 0,
            missing: 0,
          });
      }

      toast({
        title: "Reset erfolgreich",
        description: "Alle Gläser wurden zurückgesetzt. Bar ist vollständig aufgefüllt.",
      });

      await loadGlasses();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler beim Reset",
        description: (error as Error).message,
      });
    } finally {
      setResetting(false);
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
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-3xl truncate">Schichtende - Inventur</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isMobile ? "Bestand erfassen" : "Erfassen Sie den aktuellen Bestand an der Bar. Fehlende Gläser werden automatisch berechnet."}
              </CardDescription>
            </div>
            <Button
              onClick={resetAllGlasses}
              disabled={resetting || saving}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto shrink-0"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span className="truncate">{isMobile ? "Reset" : "Alles zurücksetzen"}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isMobile ? (
            <div className="space-y-3">
              {glasses.map((glass) => (
                <Card key={glass.id} className={glass.missing > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground truncate">{glass.category}</p>
                      <p className="font-semibold text-sm truncate">{glass.name}</p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Soll</span>
                        <span className="font-bold text-sm">{glass.bar_target}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <Label className="text-xs text-muted-foreground shrink-0">Haben</Label>
                        <Input
                          type="number"
                          min="0"
                          max={glass.bar_target}
                          value={glass.bar_count}
                          onChange={(e) => updateBarCount(glass.id, parseInt(e.target.value) || 0)}
                          className="w-20 text-center h-8"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Holen</span>
                        <span className={`font-bold text-sm ${glass.missing > 0 ? 'text-destructive' : 'text-success'}`}>
                          {glass.missing}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Kategorie</TableHead>
                    <TableHead className="font-bold">Glas</TableHead>
                    <TableHead className="font-bold text-center">Soll</TableHead>
                    <TableHead className="font-bold text-center">Haben</TableHead>
                    <TableHead className="font-bold text-center">Holen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glasses.map((glass) => (
                    <TableRow key={glass.id}>
                      <TableCell className="font-medium">{glass.category}</TableCell>
                      <TableCell>{glass.name}</TableCell>
                      <TableCell className="text-center">{glass.bar_target}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max={glass.bar_target}
                          value={glass.bar_count}
                          onChange={(e) => updateBarCount(glass.id, parseInt(e.target.value) || 0)}
                          className="w-24 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${glass.missing > 0 ? 'text-destructive' : 'text-success'}`}>
                          {glass.missing}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex justify-end">
            <Button
              size={isMobile ? "default" : "lg"}
              onClick={saveInventory}
              disabled={saving || resetting}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="truncate">Speichern...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{isMobile ? "Speichern" : "Inventur speichern"}</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Schichtende;
