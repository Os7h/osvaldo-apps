import { isSeeded, markSeeded, setTable } from "../storage";

const PREFIX = "wi";

const categories = [
  { id: "cat01", name: "Spirituosen", icon: "🥃", parent_id: null, description: "Hochprozentige Getränke", sort_order: 1 },
  { id: "cat02", name: "Wein", icon: "🍷", parent_id: null, description: "Rot-, Weiß- und Roséweine", sort_order: 2 },
  { id: "cat03", name: "Bier", icon: "🍺", parent_id: null, description: "Craft- und Fassbier", sort_order: 3 },
  { id: "cat04", name: "Alkoholfrei", icon: "🧃", parent_id: null, description: "Softdrinks, Säfte, Wasser", sort_order: 4 },
  { id: "cat05", name: "Küche", icon: "🍳", parent_id: null, description: "Lebensmittel und Zutaten", sort_order: 5 },
  { id: "cat06", name: "Reinigung", icon: "🧹", parent_id: null, description: "Reinigungsmittel und Hygiene", sort_order: 6 },
];

const products = [
  { id: "p01", name: "Absolut Vodka 0.7L", barcode: "7312040017072", cost_price: 12.50, sell_price: 22.90, unit_type: "count", category_id: "cat01", is_active: true, description: "Schwedischer Premium-Vodka" },
  { id: "p02", name: "Hendrick's Gin 0.7L", barcode: "5010327705064", cost_price: 22.00, sell_price: 34.90, unit_type: "count", category_id: "cat01", is_active: true, description: "Schottischer Gin mit Gurke und Rose" },
  { id: "p03", name: "Havana Club 3 Años 0.7L", barcode: "8501110080439", cost_price: 11.00, sell_price: 18.90, unit_type: "count", category_id: "cat01", is_active: true, description: "Kubanischer weißer Rum" },
  { id: "p04", name: "Macallan 12 Jahre 0.7L", barcode: "5010314302108", cost_price: 38.00, sell_price: 59.90, unit_type: "count", category_id: "cat01", is_active: true, description: "Single Malt Scotch Whisky" },
  { id: "p05", name: "Cointreau 0.7L", barcode: "3035542004404", cost_price: 16.00, sell_price: 26.90, unit_type: "count", category_id: "cat01", is_active: true, description: "Französischer Orangenlikör" },
  { id: "p06", name: "Chianti Classico DOCG 0.75L", barcode: "8001440065015", cost_price: 8.50, sell_price: 16.90, unit_type: "count", category_id: "cat02", is_active: true, description: "Toskanischer Rotwein" },
  { id: "p07", name: "Riesling Spätlese 0.75L", barcode: "4022025101016", cost_price: 7.50, sell_price: 14.90, unit_type: "count", category_id: "cat02", is_active: true, description: "Deutscher Weißwein, halbtrocken" },
  { id: "p08", name: "Prosecco DOC 0.75L", barcode: "8002270015007", cost_price: 5.50, sell_price: 11.90, unit_type: "count", category_id: "cat02", is_active: true, description: "Italienischer Schaumwein" },
  { id: "p09", name: "Rioja Reserva 0.75L", barcode: "8410702049510", cost_price: 10.00, sell_price: 19.90, unit_type: "count", category_id: "cat02", is_active: true, description: "Spanischer Rotwein, 24 Monate Fass" },
  { id: "p10", name: "Augustiner Helles 0.5L", barcode: "4006712007012", cost_price: 0.85, sell_price: 3.90, unit_type: "count", category_id: "cat03", is_active: true, description: "Münchner Lagerbier" },
  { id: "p11", name: "Schlenkerla Rauchbier 0.5L", barcode: "4017700050016", cost_price: 1.10, sell_price: 4.50, unit_type: "count", category_id: "cat03", is_active: true, description: "Bamberger Rauchbier Märzen" },
  { id: "p12", name: "Weihenstephaner Hefeweizen 0.5L", barcode: "4002960017013", cost_price: 0.90, sell_price: 4.20, unit_type: "count", category_id: "cat03", is_active: true, description: "Bayerisches Weißbier" },
  { id: "p13", name: "Paulaner Spezi 0.33L", barcode: "4066600612018", cost_price: 0.65, sell_price: 2.90, unit_type: "count", category_id: "cat04", is_active: true, description: "Cola-Orangenlimo-Mix" },
  { id: "p14", name: "Fritz-Kola 0.33L", barcode: "4260107220015", cost_price: 0.70, sell_price: 3.20, unit_type: "count", category_id: "cat04", is_active: true, description: "Hamburger Premium-Cola" },
  { id: "p15", name: "Bionade Holunder 0.33L", barcode: "4014472133018", cost_price: 0.75, sell_price: 3.50, unit_type: "count", category_id: "cat04", is_active: true, description: "Bio-Limonade" },
  { id: "p16", name: "San Pellegrino 0.75L", barcode: "8002270000003", cost_price: 0.90, sell_price: 3.90, unit_type: "count", category_id: "cat04", is_active: true, description: "Italienisches Mineralwasser" },
  { id: "p17", name: "Safran Premium", barcode: "8412345678901", cost_price: 85.00, sell_price: 149.90, unit_type: "weight", category_id: "cat05", is_active: true, description: "Iranischer Safran, 10g Dose" },
  { id: "p18", name: "Olivenöl Extra Vergine 1L", barcode: "8007150901012", cost_price: 8.50, sell_price: 16.90, unit_type: "volume", category_id: "cat05", is_active: true, description: "Kaltgepresstes Olivenöl aus der Toskana" },
  { id: "p19", name: "Balsamico di Modena 250ml", barcode: "8006550902015", cost_price: 6.00, sell_price: 12.90, unit_type: "volume", category_id: "cat05", is_active: true, description: "Traditioneller Balsamessig" },
  { id: "p20", name: "Edamame tiefgefroren 500g", barcode: "4901001234567", cost_price: 2.50, sell_price: 4.90, unit_type: "weight", category_id: "cat05", is_active: true, description: "Japanische Sojabohnen" },
  { id: "p21", name: "Trüffelöl 100ml", barcode: "8005120301014", cost_price: 12.00, sell_price: 24.90, unit_type: "volume", category_id: "cat05", is_active: true, description: "Weißes Trüffelöl" },
  { id: "p22", name: "Spülmaschinentabs 60er", barcode: "4015000965019", cost_price: 8.00, sell_price: 14.90, unit_type: "count", category_id: "cat06", is_active: true, description: "All-in-One Tabs" },
  { id: "p23", name: "Glasreiniger 750ml", barcode: "4015000313018", cost_price: 2.50, sell_price: 4.90, unit_type: "count", category_id: "cat06", is_active: true, description: "Streifenfreier Glanz" },
  { id: "p24", name: "Desinfektionsmittel 1L", barcode: "4100060032016", cost_price: 4.00, sell_price: 8.90, unit_type: "count", category_id: "cat06", is_active: true, description: "Flächendesinfektion EN 14476" },
  { id: "p25", name: "Handseife Sensitiv 500ml", barcode: "4015000530019", cost_price: 1.80, sell_price: 3.90, unit_type: "count", category_id: "cat06", is_active: true, description: "Für empfindliche Haut" },
];

const stock_entries = [
  { id: "s01", product_id: "p01", current_quantity: 8, min_threshold: 5, location: "Hauptlager Regal A1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s02", product_id: "p02", current_quantity: 3, min_threshold: 4, location: "Hauptlager Regal A1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s03", product_id: "p03", current_quantity: 12, min_threshold: 6, location: "Hauptlager Regal A2", last_counted: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "s04", product_id: "p04", current_quantity: 2, min_threshold: 3, location: "Tresor", last_counted: new Date(Date.now() - 86400000).toISOString() },
  { id: "s05", product_id: "p05", current_quantity: 6, min_threshold: 4, location: "Hauptlager Regal A2", last_counted: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "s06", product_id: "p06", current_quantity: 18, min_threshold: 10, location: "Weinkeller Regal 1", last_counted: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "s07", product_id: "p07", current_quantity: 10, min_threshold: 8, location: "Weinkeller Regal 2", last_counted: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "s08", product_id: "p08", current_quantity: 24, min_threshold: 12, location: "Weinkeller Regal 3", last_counted: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "s09", product_id: "p09", current_quantity: 5, min_threshold: 6, location: "Weinkeller Regal 1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s10", product_id: "p10", current_quantity: 48, min_threshold: 24, location: "Kühlraum Kiste 1", last_counted: new Date(Date.now() - 86400000).toISOString() },
  { id: "s11", product_id: "p11", current_quantity: 30, min_threshold: 12, location: "Kühlraum Kiste 2", last_counted: new Date(Date.now() - 86400000).toISOString() },
  { id: "s12", product_id: "p12", current_quantity: 36, min_threshold: 18, location: "Kühlraum Kiste 3", last_counted: new Date(Date.now() - 86400000).toISOString() },
  { id: "s13", product_id: "p13", current_quantity: 20, min_threshold: 12, location: "Kühlraum Regal B1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s14", product_id: "p14", current_quantity: 18, min_threshold: 12, location: "Kühlraum Regal B1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s15", product_id: "p15", current_quantity: 15, min_threshold: 10, location: "Kühlraum Regal B2", last_counted: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "s16", product_id: "p16", current_quantity: 22, min_threshold: 12, location: "Kühlraum Regal B2", last_counted: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "s17", product_id: "p17", current_quantity: 1, min_threshold: 2, location: "Küche Gewürzschrank", last_counted: new Date(Date.now() - 86400000).toISOString() },
  { id: "s18", product_id: "p18", current_quantity: 4, min_threshold: 3, location: "Küche Regal 1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s19", product_id: "p19", current_quantity: 3, min_threshold: 2, location: "Küche Regal 1", last_counted: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s20", product_id: "p20", current_quantity: 1, min_threshold: 3, location: "Küche Tiefkühler", last_counted: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "s21", product_id: "p21", current_quantity: 2, min_threshold: 2, location: "Küche Gewürzschrank", last_counted: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "s22", product_id: "p22", current_quantity: 3, min_threshold: 2, location: "Reinigungslager", last_counted: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: "s23", product_id: "p23", current_quantity: 5, min_threshold: 3, location: "Reinigungslager", last_counted: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: "s24", product_id: "p24", current_quantity: 2, min_threshold: 3, location: "Reinigungslager", last_counted: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "s25", product_id: "p25", current_quantity: 4, min_threshold: 3, location: "Toiletten", last_counted: new Date(Date.now() - 86400000 * 7).toISOString() },
];

// Generate 25 transactions over the last 90 days
function generateTransactions() {
  const now = Date.now();
  const day = 86400000;

  const txns = [
    { id: "t01", product_id: "p01", type: "sale", quantity: 2, unit_price: 22.90, total_amount: 45.80, channel: "restaurant", notes: "Abendservice", created_at: new Date(now - day * 1).toISOString() },
    { id: "t02", product_id: "p06", type: "sale", quantity: 3, unit_price: 16.90, total_amount: 50.70, channel: "restaurant", notes: "Weinabend", created_at: new Date(now - day * 2).toISOString() },
    { id: "t03", product_id: "p10", type: "sale", quantity: 12, unit_price: 3.90, total_amount: 46.80, channel: "store", notes: "Stammkunde Großbestellung", created_at: new Date(now - day * 3).toISOString() },
    { id: "t04", product_id: "p02", type: "sale", quantity: 1, unit_price: 34.90, total_amount: 34.90, channel: "online", notes: "Online-Bestellung #412", created_at: new Date(now - day * 5).toISOString() },
    { id: "t05", product_id: "p14", type: "sale", quantity: 6, unit_price: 3.20, total_amount: 19.20, channel: "restaurant", notes: "Mittagsservice", created_at: new Date(now - day * 7).toISOString() },
    { id: "t06", product_id: "p01", type: "purchase", quantity: 6, unit_price: 12.50, total_amount: 75.00, channel: "store", notes: "Lieferung Metro", created_at: new Date(now - day * 10).toISOString() },
    { id: "t07", product_id: "p06", type: "purchase", quantity: 12, unit_price: 8.50, total_amount: 102.00, channel: "store", notes: "Lieferung Weingroßhandel", created_at: new Date(now - day * 12).toISOString() },
    { id: "t08", product_id: "p10", type: "purchase", quantity: 24, unit_price: 0.85, total_amount: 20.40, channel: "store", notes: "Lieferung Getränkemarkt", created_at: new Date(now - day * 14).toISOString() },
    { id: "t09", product_id: "p08", type: "sale", quantity: 4, unit_price: 11.90, total_amount: 47.60, channel: "restaurant", notes: "Aperitif-Runde", created_at: new Date(now - day * 15).toISOString() },
    { id: "t10", product_id: "p04", type: "sale", quantity: 1, unit_price: 59.90, total_amount: 59.90, channel: "store", notes: "Einzelverkauf Premium", created_at: new Date(now - day * 18).toISOString() },
    { id: "t11", product_id: "p17", type: "purchase", quantity: 2, unit_price: 85.00, total_amount: 170.00, channel: "store", notes: "Gewürzimport Iran", created_at: new Date(now - day * 20).toISOString() },
    { id: "t12", product_id: "p03", type: "sale", quantity: 3, unit_price: 18.90, total_amount: 56.70, channel: "online", notes: "Online-Bestellung #398", created_at: new Date(now - day * 22).toISOString() },
    { id: "t13", product_id: "p15", type: "sale", quantity: 8, unit_price: 3.50, total_amount: 28.00, channel: "restaurant", notes: "Kindergeburtstag", created_at: new Date(now - day * 25).toISOString() },
    { id: "t14", product_id: "p09", type: "return", quantity: 1, unit_price: 19.90, total_amount: 19.90, channel: "store", notes: "Korkfehler", created_at: new Date(now - day * 28).toISOString() },
    { id: "t15", product_id: "p22", type: "purchase", quantity: 2, unit_price: 8.00, total_amount: 16.00, channel: "store", notes: "Monatsbestellung Reinigung", created_at: new Date(now - day * 30).toISOString() },
    { id: "t16", product_id: "p07", type: "sale", quantity: 2, unit_price: 14.90, total_amount: 29.80, channel: "restaurant", notes: "Abendservice", created_at: new Date(now - day * 35).toISOString() },
    { id: "t17", product_id: "p12", type: "sale", quantity: 6, unit_price: 4.20, total_amount: 25.20, channel: "store", notes: "Feierabendverkauf", created_at: new Date(now - day * 40).toISOString() },
    { id: "t18", product_id: "p18", type: "purchase", quantity: 3, unit_price: 8.50, total_amount: 25.50, channel: "store", notes: "Küchenbestellung", created_at: new Date(now - day * 45).toISOString() },
    { id: "t19", product_id: "p20", type: "adjust", quantity: -2, unit_price: 4.90, total_amount: 0, channel: "restaurant", notes: "Schwund — abgelaufen", created_at: new Date(now - day * 50).toISOString() },
    { id: "t20", product_id: "p05", type: "sale", quantity: 2, unit_price: 26.90, total_amount: 53.80, channel: "online", notes: "Online-Bestellung #371", created_at: new Date(now - day * 55).toISOString() },
    { id: "t21", product_id: "p11", type: "sale", quantity: 4, unit_price: 4.50, total_amount: 18.00, channel: "restaurant", notes: "Bierprobe-Event", created_at: new Date(now - day * 60).toISOString() },
    { id: "t22", product_id: "p24", type: "purchase", quantity: 4, unit_price: 4.00, total_amount: 16.00, channel: "store", notes: "Hygienebedarf", created_at: new Date(now - day * 65).toISOString() },
    { id: "t23", product_id: "p13", type: "sale", quantity: 10, unit_price: 2.90, total_amount: 29.00, channel: "store", notes: "Sommeraktion", created_at: new Date(now - day * 70).toISOString() },
    { id: "t24", product_id: "p16", type: "sale", quantity: 5, unit_price: 3.90, total_amount: 19.50, channel: "restaurant", notes: "Mittagsservice", created_at: new Date(now - day * 80).toISOString() },
    { id: "t25", product_id: "p21", type: "sale", quantity: 1, unit_price: 24.90, total_amount: 24.90, channel: "online", notes: "Online-Bestellung #350", created_at: new Date(now - day * 88).toISOString() },
  ];

  return txns;
}

const ai_insights = [
  {
    id: "ai01",
    type: "demand_prediction",
    title: "Augustiner Helles — Nachfrageanstieg erwartet",
    description: "Basierend auf historischen Daten und kommenden Events (Bierfest nächsten Monat) wird ein 40% höherer Absatz erwartet. Empfohlene Bestellung: 3 zusätzliche Kisten.",
    confidence: 0.87,
    product_id: "p10",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status: "active",
  },
  {
    id: "ai02",
    type: "demand_prediction",
    title: "Safran Premium — Slow Mover",
    description: "Der aktuelle Bestand reicht bei durchschnittlichem Verbrauch noch 45 Tage. Keine Nachbestellung nötig. Prüfen Sie Haltbarkeitsdatum.",
    confidence: 0.92,
    product_id: "p17",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "active",
  },
  {
    id: "ai03",
    type: "demand_prediction",
    title: "Prosecco DOC — Saisonaler Peak",
    description: "Sommermonate zeigen historisch 60% mehr Prosecco-Verkäufe. Empfehlung: Bestand auf 36 Flaschen erhöhen.",
    confidence: 0.78,
    product_id: "p08",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "active",
  },
  {
    id: "ai04",
    type: "demand_prediction",
    title: "Fritz-Kola — Stabiler Absatz",
    description: "Konsistente Nachfrage über alle Kanäle. Aktueller Bestand ist optimal. Keine Anpassung erforderlich.",
    confidence: 0.95,
    product_id: "p14",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: "dismissed",
  },
  {
    id: "ai05",
    type: "demand_prediction",
    title: "Chianti Classico — Cross-Selling-Potenzial",
    description: "Kunden, die Chianti kaufen, bestellen häufig Olivenöl und Balsamico mit. Bundle-Angebot könnte den Umsatz um 25% steigern.",
    confidence: 0.83,
    product_id: "p06",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: "active",
  },
];

export function seedWeltInventar() {
  if (isSeeded(PREFIX)) return;
  setTable(PREFIX, "categories", categories);
  setTable(PREFIX, "products", products);
  setTable(PREFIX, "stock_entries", stock_entries);
  setTable(PREFIX, "transactions", generateTransactions());
  setTable(PREFIX, "ai_insights", ai_insights);
  markSeeded(PREFIX);
}

export const WI_PREFIX = PREFIX;
