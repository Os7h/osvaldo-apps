import { useEffect, useMemo, useState } from "react";
import { supabase } from "../db";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AboutThisApp from "@/components/shared/AboutThisApp";
import ResetDemoButton from "@/components/shared/ResetDemoButton";
import AppGuide from "@/components/shared/AppGuide";
import { UtensilsCrossed, Timer, Percent } from "lucide-react";

const guideSteps = [
  { icon: UtensilsCrossed, title: "1. Bestell was du willst", description: "Klick auf \"Hinzufügen\" bei jedem Gericht. Bei Burgern kannst du kleine Pommes dazu nehmen, bei Salaten ein Dressing wählen." },
  { icon: Percent, title: "2. Happy Hour checken", description: "Zwischen 17:00 und 19:00 Uhr sind Burger günstiger! Der Preis wird automatisch angepasst — achte auf das Badge." },
  { icon: Timer, title: "3. Abholen planen", description: "Wähle eine Abholzeit, gib Name und Telefon ein, und bestelle. Im \"Backoffice\" oben rechts siehst du alle Bestellungen." },
];
import { PK_PREFIX, seedPickup } from "@/lib/mock-db/seed/pickup";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Clock, Zap, Settings } from "lucide-react";

interface MenuItem {
  id: string; name: string; category: string; price_eur: number; available: boolean; is_burger: boolean; description?: string | null;
}
interface AppSettings {
  pickup_slot_minutes: number; min_prep_minutes: number; kitchen_close_time: string; currency: string;
  happy_hour_burger_price?: number | null; happy_hour_start?: string | null; happy_hour_end?: string | null; timezone?: string | null;
}
interface CartItem {
  id: string; name: string; price_eur: number; quantity: number; isBurger: boolean;
  friesSmall?: boolean; sauces?: string[]; saucesIncluded?: number; dressings?: string[]; dressingsIncluded?: number;
}

const SAUCES = ["Ketchup", "Mayonnaise", "Sour Cream"] as const;
const DRESSINGS = ["Joghurt", "Balsamico", "French"] as const;

const aboutFeatures = [
  { icon: ShoppingCart, title: "Smart Menu & Cart", description: "Browse categories, add items with complex modifiers (sauces, dressings, add-ons)." },
  { icon: Zap, title: "Happy Hour Auto-Pricing", description: "Burger prices automatically drop during Happy Hour (17:00-19:00)." },
  { icon: Clock, title: "Pickup Time Slots", description: "Dynamic slot calculation based on prep time and kitchen closing hours." },
  { icon: Settings, title: "Admin Backoffice", description: "View and manage all orders with customer details and status tracking." },
];

const Index = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [addOnOpen, setAddOnOpen] = useState(false);
  const [addOnMode, setAddOnMode] = useState<"burger" | "fries" | "currywurst" | "salad">("burger");
  const [attachBurgerIndex, setAttachBurgerIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: settingsData, error: settingsError } = await supabase.from("settings").select("*").limit(1).single();
        if (settingsError) throw settingsError;
        setSettings(settingsData as AppSettings);
        const { data: menuData, error: menuError } = await supabase.from("menu_items").select("*").eq("available", true).order("category").order("name");
        if (menuError) throw menuError;
        setMenu((menuData || []) as MenuItem[]);
      } catch (e: unknown) {
        toast({ title: "Fehler", description: (e as Error).message, variant: "destructive" });
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const isHappyHour = useMemo(() => {
    if (!settings?.happy_hour_start || !settings?.happy_hour_end) return false;
    const now = new Date();
    const [sh, sm] = settings.happy_hour_start.split(":").map(Number);
    const [eh, em] = settings.happy_hour_end.split(":").map(Number);
    const start = new Date(); start.setHours(sh, sm, 0, 0);
    const end = new Date(); end.setHours(eh, em, 0, 0);
    if (end <= start) return now >= start;
    return now >= start && now <= end;
  }, [settings?.happy_hour_start, settings?.happy_hour_end]);

  const shouldHidePommesAddon = (item: MenuItem) => !item.is_burger && /pommes|fritten/i.test(item.name) && Number(item.price_eur) >= 2.6 && Number(item.price_eur) <= 3.0;
  const filteredMenu = useMemo(() => menu.filter((i) => !shouldHidePommesAddon(i)), [menu]);
  const isFriesItem = (item: MenuItem) => /pommes|fritten/i.test(item.name);
  const isCurrywurstItem = (item: MenuItem) => /currywurst/i.test(item.name);
  const isSaladItem = (item: MenuItem) => /salat/i.test(item.category) || /salat/i.test(item.name);

  const grouped = useMemo(() => filteredMenu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item); return acc;
  }, {}), [filteredMenu]);

  const getItemBasePrice = (item: MenuItem) => {
    if (item.is_burger && isHappyHour && settings?.happy_hour_burger_price != null) return Number(settings.happy_hour_burger_price);
    return Number(item.price_eur);
  };

  const getCartItemUnitPrice = (ci: CartItem) => {
    const base = ci.isBurger ? (isHappyHour && settings?.happy_hour_burger_price != null ? Number(settings.happy_hour_burger_price) : Number(ci.price_eur)) : Number(ci.price_eur);
    const delta = ci.friesSmall ? 2.8 : 0;
    const sauceExtras = Math.max(0, (ci.sauces?.length ?? 0) - (ci.saucesIncluded ?? 0));
    const dressingExtras = Math.max(0, (ci.dressings?.length ?? 0) - (ci.dressingsIncluded ?? 0));
    return base + delta + (sauceExtras + dressingExtras) * 0.2;
  };

  const openAddOnForBurger = (burgerIndex: number) => { setAddOnMode("burger"); setAttachBurgerIndex(burgerIndex); setSelectedOptions([]); setAddOnOpen(true); };
  const openAddOnForFries = (item: MenuItem) => { setAddOnMode("fries"); setPendingItem(item); setSelectedOptions([]); setAddOnOpen(true); };

  const confirmSmallFries = () => {
    if (attachBurgerIndex == null) return;
    if (selectedOptions.length < 1) { toast({ title: "Saucen wählen", description: "Bitte mindestens 1 Sauce wählen." }); return; }
    setCart((prev) => { const copy = [...prev]; if (!copy[attachBurgerIndex]) return prev; copy[attachBurgerIndex] = { ...copy[attachBurgerIndex], friesSmall: true, sauces: selectedOptions, saucesIncluded: 1 }; return copy; });
    setAddOnOpen(false);
  };

  const chooseRegularFries = () => {
    if (!pendingItem) return;
    if (selectedOptions.length < 1) { toast({ title: "Saucen wählen", description: "Bitte mindestens 1 Sauce wählen." }); return; }
    setCart((prev) => {
      const idx = prev.findIndex((i) => !i.isBurger && i.id === pendingItem.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }; return copy; }
      return [...prev, { id: pendingItem.id, name: pendingItem.name, price_eur: Number(pendingItem.price_eur), quantity: 1, isBurger: false, sauces: selectedOptions, saucesIncluded: 1 }];
    });
    setAddOnOpen(false);
  };

  const confirmSmallFriesFromFriesFlow = () => {
    const lastBurgerIdx = [...cart].map((c, i) => ({ c, i })).filter(({ c }) => c.isBurger).map(({ i }) => i).pop();
    if (lastBurgerIdx == null) { chooseRegularFries(); return; }
    setAttachBurgerIndex(lastBurgerIdx);
    confirmSmallFries();
  };

  const confirmSaucesOnly = () => {
    if (!pendingItem) return;
    if (selectedOptions.length < 1) { toast({ title: "Saucen wählen", description: "Bitte mindestens 1 Sauce wählen." }); return; }
    setCart((prev) => ([...prev, { id: pendingItem.id, name: pendingItem.name, price_eur: Number(pendingItem.price_eur), quantity: 1, isBurger: false, sauces: selectedOptions, saucesIncluded: 1 }]));
    setAddOnOpen(false);
  };

  const confirmDressings = () => {
    if (!pendingItem) return;
    if (selectedOptions.length < 1) { toast({ title: "Dressing wählen", description: "Bitte mindestens 1 Dressing wählen." }); return; }
    setCart((prev) => ([...prev, { id: pendingItem.id, name: pendingItem.name, price_eur: Number(pendingItem.price_eur), quantity: 1, isBurger: false, dressings: selectedOptions, dressingsIncluded: 1 }]));
    setAddOnOpen(false);
  };

  const addToCart = (item: MenuItem) => {
    if (item.is_burger) { setCart((prev) => { const next = [...prev, { id: item.id, name: item.name, price_eur: Number(item.price_eur), quantity: 1, isBurger: true } as CartItem]; openAddOnForBurger(next.length - 1); return next; }); return; }
    if (isCurrywurstItem(item)) { setAddOnMode("currywurst"); setPendingItem(item); setSelectedOptions([]); setAddOnOpen(true); return; }
    if (isFriesItem(item)) { openAddOnForFries(item); return; }
    if (isSaladItem(item)) { setAddOnMode("salad"); setPendingItem(item); setSelectedOptions([]); setAddOnOpen(true); return; }
    setCart((prev) => {
      const existing = prev.find((i) => !i.isBurger && i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id && !i.isBurger ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { id: item.id, name: item.name, price_eur: Number(item.price_eur), quantity: 1, isBurger: false }];
    });
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));
  const changeQty = (index: number, delta: number) => setCart((prev) => prev.map((i, idx) => (idx === index ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  const subtotal = useMemo(() => cart.reduce((s, i) => s + getCartItemUnitPrice(i) * i.quantity, 0), [cart, isHappyHour, settings?.happy_hour_burger_price]);
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const slots = useMemo(() => {
    if (!settings) return [];
    const now = new Date(); const start = new Date(now.getTime() + settings.min_prep_minutes * 60 * 1000);
    const [h, m] = settings.kitchen_close_time.split(":").map(Number);
    const close = new Date(); close.setHours(h, m, 0, 0);
    const out: { label: string; value: string }[] = []; let cur = new Date(start);
    while (cur <= close) { out.push({ label: cur.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: cur.toISOString() }); cur = new Date(cur.getTime() + settings.pickup_slot_minutes * 60 * 1000); }
    return out;
  }, [settings]);

  const placeOrder = async () => {
    if (!settings) return;
    if (!name.trim() || !phone.trim()) { toast({ title: "Bitte Name und Telefon", description: "Diese Felder sind erforderlich." }); return; }
    if (!selectedSlot) { toast({ title: "Abholzeit wählen", description: "Bitte wähle einen Abholzeitraum." }); return; }
    if (cart.length === 0) { toast({ title: "Warenkorb leer", description: "Bitte füge Produkte hinzu." }); return; }
    const orderItems = cart.map((c) => ({
      id: c.id,
      name: c.name + (c.isBurger && c.friesSmall ? ` + Pommes (klein${c.sauces?.length ? ", " + c.sauces.join(", ") : ""})` : "") + (!c.isBurger && c.sauces?.length ? ` (${c.sauces.join(", ")})` : "") + (c.dressings?.length ? ` (Dressing: ${c.dressings.join(", ")})` : ""),
      quantity: c.quantity, price_eur: getCartItemUnitPrice(c),
    }));
    const { data, error } = await supabase.from("orders").insert({ phone, customer_name: name, items: orderItems, pickup_slot: selectedSlot, subtotal_eur: subtotal, total_eur: subtotal, discount_eur: 0, currency: settings.currency, status: "cart", notes }).select("id").single();
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Bestellung erstellt", description: "Weiterleitung zur Bestätigung..." });
    navigate(`/pickup/order/${data!.id}`);
  };

  const handleReset = () => { seedPickup(); window.location.reload(); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p>Lädt...</p></div>;

  const cartItemLabel = (c: CartItem) =>
    c.name + (c.isBurger && c.friesSmall ? ` + Pommes (klein${c.sauces?.length ? ", " + c.sauces.join(", ") : ""})` : "") + (!c.isBurger && c.sauces?.length ? ` (${c.sauces.join(", ")})` : "") + (c.dressings?.length ? ` (Dressing: ${c.dressings.join(", ")})` : "");

  const orderForm = (idSuffix: string) => (
    <div className="space-y-2 pt-4">
      <Label htmlFor={`name${idSuffix}`}>Name</Label>
      <Input id={`name${idSuffix}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name" />
      <Label htmlFor={`phone${idSuffix}`}>Telefon</Label>
      <Input id={`phone${idSuffix}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="z. B. 0151..." />
      <Label htmlFor={`slot${idSuffix}`}>Abholzeit</Label>
      <select id={`slot${idSuffix}`} value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} className="w-full rounded-md border border-border bg-background p-2">
        <option value="">Bitte wählen...</option>
        {slots.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <Label htmlFor={`notes${idSuffix}`}>Hinweise (optional)</Label>
      <Textarea id={`notes${idSuffix}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergien, Sonderwünsche..." rows={3} />
      <Button className="w-full mt-2" onClick={placeOrder} disabled={cart.length === 0}>Bestellen (ohne Zahlung)</Button>
    </div>
  );

  const cartList = (
    <>
      {cart.length === 0 ? <p className="text-muted-foreground">Noch keine Artikel.</p> : (
        <div className="space-y-3">
          {cart.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{cartItemLabel(c)}</div>
                <div className="text-sm text-muted-foreground">€ {getCartItemUnitPrice(c).toFixed(2)} x {c.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeQty(idx, -1)}>-</Button>
                <span>{c.quantity}</span>
                <Button variant="outline" size="icon" onClick={() => changeQty(idx, 1)}>+</Button>
                <Button variant="ghost" size="sm" onClick={() => removeFromCart(idx)}>X</Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-medium">Zwischensumme</span>
            <span className="font-semibold">€ {subtotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
      {/* Top bar */}
      <nav className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Wozi Pickup</h1>
          <div className="flex items-center gap-1">
            <Link to="/pickup/backoffice" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Backoffice</Link>
            <ResetDemoButton appPrefix={PK_PREFIX} onReset={handleReset} />
            <AboutThisApp appName="Wozi Pickup" tagline="Food Ordering System" description="A customer-facing food ordering system with a dynamic menu, complex modifier system for sauces and dressings, automatic Happy Hour pricing for burgers, pickup time slot calculation based on prep time and kitchen hours, and an admin backoffice for order management." features={aboutFeatures} techStack={["React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "localStorage"]} />
            <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </div>
      </nav>

      <AppGuide
        appName="Wozi Pickup"
        tagline="Bestell-System für die Bar"
        intro="Bestelle wie ein echter Gast! Stöbere durch die Karte, leg Burger mit Pommes in den Warenkorb, wähle Saucen und Dressings, und schick die Bestellung ab. Die App berechnet Happy-Hour-Preise automatisch und schlägt Abholzeiten vor."
        steps={guideSteps}
        storageKey="pk_guide"
      />
      <section className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 space-y-6">
          <header>
            <h2 className="text-3xl font-semibold">Menü & Bestellung</h2>
            <p className="text-muted-foreground">Wähle deine Favoriten.{isHappyHour && <Badge variant="secondary" className="ml-2">Happy Hour aktiv!</Badge>}</p>
          </header>
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category} className="border-border">
              <CardHeader><h3 className="text-xl font-medium">{category}</h3></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const price = getItemBasePrice(item);
                  const isHHBurger = item.is_burger && isHappyHour && settings?.happy_hour_burger_price != null;
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 border rounded-md p-4 border-border">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        {isHHBurger && <div className="mt-1"><Badge variant="secondary">Happy Hour</Badge></div>}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {isHHBurger ? (<><span className="text-muted-foreground line-through mr-1">€ {Number(item.price_eur).toFixed(2)}</span><span className="text-primary">€ {price.toFixed(2)}</span></>) : (<>€ {price.toFixed(2)}</>)}
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => addToCart(item)}>Hinzufügen</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </article>
        {/* Desktop Cart */}
        <aside className="lg:col-span-1 hidden lg:block">
          <Card className="border-border sticky top-4">
            <CardHeader><h3 className="text-xl font-medium">Warenkorb</h3></CardHeader>
            <CardContent className="space-y-4">{cartList}{orderForm("")}</CardContent>
          </Card>
        </aside>
      </section>

      {/* Mobile floating cart */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div><div className="text-sm text-muted-foreground">{itemCount} Artikel</div><div className="font-semibold">€ {subtotal.toFixed(2)}</div></div>
          <Button onClick={() => setMobileCartOpen(true)}>Warenkorb</Button>
        </div>
      </div>
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh]"><SheetHeader><SheetTitle>Warenkorb</SheetTitle></SheetHeader><div className="space-y-4 py-4">{cartList}{orderForm("_m")}</div></SheetContent>
      </Sheet>

      {/* Add-on Dialog */}
      <Dialog open={addOnOpen} onOpenChange={setAddOnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addOnMode === "burger" && "Pommes klein für €2,80 hinzufügen?"}
              {addOnMode === "fries" && "Pommes – Optionen"}
              {addOnMode === "currywurst" && "Saucen wählen"}
              {addOnMode === "salad" && "Dressing wählen"}
            </DialogTitle>
            <DialogDescription>
              {addOnMode === "burger" && "Kleine Pommes hinzufügen (nur mit Burger). Saucen wählen:"}
              {addOnMode === "fries" && "Saucen wählen. 1 inklusive, +€0,20 je Extra."}
              {addOnMode === "currywurst" && "Pommes inklusive. Saucen wählen (1 inkl., +€0,20 je Extra)."}
              {addOnMode === "salad" && "Dressing auswählen (1 inkl., +€0,20 je Extra)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">{addOnMode === "salad" ? "Dressing" : "Saucen"}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(addOnMode === "salad" ? DRESSINGS : SAUCES).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 border rounded-md p-2 cursor-pointer">
                    <Checkbox checked={selectedOptions.includes(opt)} onCheckedChange={(val) => setSelectedOptions((prev) => val ? [...prev, opt] : prev.filter((o) => o !== opt))} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1 inklusive, jede weitere +€0,20</p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            {addOnMode === "burger" && (<><Button variant="secondary" onClick={() => setAddOnOpen(false)}>Jetzt nicht</Button><Button onClick={confirmSmallFries}>Pommes €2,80 hinzufügen</Button></>)}
            {addOnMode === "fries" && (<div className="flex w-full gap-2"><Button variant="outline" onClick={chooseRegularFries} className="flex-1">Normale Pommes</Button><Button onClick={confirmSmallFriesFromFriesFlow} className="flex-1">Pommes €2,80</Button></div>)}
            {addOnMode === "currywurst" && (<Button onClick={confirmSaucesOnly} className="ml-auto">Bestätigen</Button>)}
            {addOnMode === "salad" && (<Button onClick={confirmDressings} className="ml-auto">Bestätigen</Button>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
