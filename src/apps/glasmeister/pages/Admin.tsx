import { useState, useEffect } from "react";
import { supabase } from "../db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackagePlus } from "lucide-react";
import Layout from "../components/Layout";

interface Glass {
  id: string;
  category: string;
  name: string;
  storage_count: number;
}

const Admin = () => {
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGlassId, setSelectedGlassId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => { loadGlasses(); }, []);

  const loadGlasses = async () => {
    try {
      const { data, error } = await supabase.from("glasses").select("*").order("category", { ascending: true }).order("name", { ascending: true });
      if (error) throw error;
      setGlasses(data || []);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler beim Laden", description: (error as Error).message });
    } finally { setLoading(false); }
  };

  const addStock = async () => {
    if (!selectedGlassId || quantity <= 0) {
      toast({ variant: "destructive", title: "Ungültige Eingabe", description: "Bitte wählen Sie ein Glas und geben Sie eine gültige Menge ein." });
      return;
    }
    setSaving(true);
    try {
      const selectedGlass = glasses.find(g => g.id === selectedGlassId);
      if (!selectedGlass) throw new Error("Glas nicht gefunden");
      const newStorageCount = selectedGlass.storage_count + quantity;
      await supabase.from("glasses").update({ storage_count: newStorageCount }).eq("id", selectedGlassId);
      toast({ title: "Lagerbestand aktualisiert", description: `${quantity} ${selectedGlass.name} hinzugefügt. Neuer Bestand: ${newStorageCount}` });
      setSelectedGlassId("");
      setQuantity(0);
      await loadGlasses();
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Fehler beim Speichern", description: (error as Error).message });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Lagerverwaltung - Admin</CardTitle>
            <CardDescription>Fügen Sie neuen Lagerbestand hinzu, wenn Lieferungen eintreffen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="glass-select">Glas auswählen</Label>
                <Select value={selectedGlassId} onValueChange={setSelectedGlassId}>
                  <SelectTrigger id="glass-select"><SelectValue placeholder="Glas wählen..." /></SelectTrigger>
                  <SelectContent>
                    {glasses.map((glass) => (
                      <SelectItem key={glass.id} value={glass.id}>{glass.category} - {glass.name} (aktuell: {glass.storage_count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Menge hinzufügen</Label>
                <Input id="quantity" type="number" min="1" value={quantity || ""} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} placeholder="z.B. 50" />
              </div>
              <Button onClick={addStock} disabled={saving || !selectedGlassId || quantity <= 0} className="w-full" size="lg">
                {saving ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Wird hinzugefügt...</>) : (<><PackagePlus className="mr-2 h-5 w-5" />Lagerbestand hinzufügen</>)}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader><CardTitle>Aktueller Lagerbestand</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {glasses.map((glass) => (
                <div key={glass.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="font-medium">{glass.category} - {glass.name}</span>
                  <span className={`font-bold ${glass.storage_count <= 10 ? 'text-destructive' : 'text-muted-foreground'}`}>{glass.storage_count} Stück</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
