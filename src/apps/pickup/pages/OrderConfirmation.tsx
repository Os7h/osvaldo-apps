import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../db";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string; customer_name: string | null; phone: string; status: string; total_eur: number; currency: string;
  items: { id: string; name: string; quantity: number; price_eur: number }[]; pickup_slot: string;
}

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); }
      else { setOrder(data as Order); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <main className="min-h-screen bg-background text-foreground flex items-center justify-center"><p>Laden...</p></main>;
  if (!order) return <main className="min-h-screen bg-background text-foreground flex items-center justify-center"><div className="text-center"><p>Bestellung nicht gefunden.</p><Button asChild className="mt-4"><Link to="/pickup">Zurück zum Menü</Link></Button></div></main>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold">Danke für deine Bestellung!</h1>
          <p className="text-muted-foreground">Bestellnummer: {order.id.slice(0, 8)}</p>
        </header>
        <article className="space-y-4 border border-border rounded-lg p-6">
          <div className="flex justify-between"><span className="font-medium">Name</span><span>{order.customer_name || "—"}</span></div>
          <div className="flex justify-between"><span className="font-medium">Telefon</span><span>{order.phone}</span></div>
          <div className="flex justify-between"><span className="font-medium">Abholzeit</span><span>{new Date(order.pickup_slot).toLocaleString()}</span></div>
          <div className="pt-4 border-t border-border">
            <h2 className="text-xl font-medium mb-2">Bestellte Artikel</h2>
            <ul className="space-y-2">
              {order.items?.map((it, i) => (<li key={i} className="flex justify-between"><span>{it.name} x {it.quantity}</span><span>€ {(it.price_eur * it.quantity).toFixed(2)}</span></li>))}
            </ul>
            <div className="flex justify-between mt-3 font-semibold"><span>Summe</span><span>€ {Number(order.total_eur).toFixed(2)}</span></div>
          </div>
          <div className="text-center pt-4"><Button asChild><Link to="/pickup">Neue Bestellung</Link></Button></div>
        </article>
      </section>
    </main>
  );
};

export default OrderConfirmation;
