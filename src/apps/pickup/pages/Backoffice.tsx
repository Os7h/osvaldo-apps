import { useEffect, useState } from "react";
import { supabase } from "../db";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface OrderRow {
  id: string; customer_name: string | null; phone: string; status: string; total_eur: number; currency: string; created_at: string;
}

const Backoffice = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(25);
      if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); }
      else { setOrders((data || []) as OrderRow[]); }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <main className="min-h-screen bg-background text-foreground flex items-center justify-center"><p>Laden...</p></main>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Backoffice</h1>
          <Link to="/pickup" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex items-center gap-1")}><ArrowLeft className="h-4 w-4" />Zurück zum Menü</Link>
        </div>
      </nav>
      <section className="container mx-auto px-4 py-8">
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr>
              <th className="text-left p-3">Zeit</th><th className="text-left p-3">Kunde</th><th className="text-left p-3">Telefon</th><th className="text-left p-3">Status</th><th className="text-left p-3">Summe</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (<tr key={o.id} className="border-t border-border">
                <td className="p-3">{new Date(o.created_at).toLocaleString()}</td><td className="p-3">{o.customer_name || "—"}</td><td className="p-3">{o.phone}</td><td className="p-3">{o.status}</td><td className="p-3">€ {Number(o.total_eur).toFixed(2)}</td>
              </tr>))}
              {orders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Keine Bestellungen</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Backoffice;
