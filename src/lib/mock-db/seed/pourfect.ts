import { isSeeded, markSeeded, setTable } from "../storage";

const PREFIX = "pf";

const products = [
  {
    id: "p01", name: "Absolut Vodka", size_ml: 700, empty_weight_g: 450, full_weight_g: 1150,
    cost_eur: 14.99, sell_price_eur: 4.50, barcode: "7312040017072", category: "Vodka", supplier: "Pernod Ricard",
  },
  {
    id: "p02", name: "Hendricks Gin", size_ml: 700, empty_weight_g: 580, full_weight_g: 1280,
    cost_eur: 28.99, sell_price_eur: 8.00, barcode: "5010327905105", category: "Gin", supplier: "William Grant",
  },
  {
    id: "p03", name: "Havana Club Rum", size_ml: 700, empty_weight_g: 460, full_weight_g: 1160,
    cost_eur: 12.99, sell_price_eur: 4.00, barcode: "8501110080439", category: "Rum", supplier: "Pernod Ricard",
  },
  {
    id: "p04", name: "Jack Daniels", size_ml: 700, empty_weight_g: 520, full_weight_g: 1220,
    cost_eur: 19.99, sell_price_eur: 5.50, barcode: "5099873006504", category: "Whiskey", supplier: "Brown-Forman",
  },
  {
    id: "p05", name: "Jagermeister", size_ml: 700, empty_weight_g: 500, full_weight_g: 1200,
    cost_eur: 13.99, sell_price_eur: 3.50, barcode: "4067700013927", category: "Likör", supplier: "Mast-Jagermeister",
  },
  {
    id: "p06", name: "Aperol", size_ml: 700, empty_weight_g: 440, full_weight_g: 1140,
    cost_eur: 11.99, sell_price_eur: 4.00, barcode: "8002230000180", category: "Aperitif", supplier: "Campari Group",
  },
  {
    id: "p07", name: "Campari", size_ml: 700, empty_weight_g: 470, full_weight_g: 1170,
    cost_eur: 14.49, sell_price_eur: 4.50, barcode: "8006150000321", category: "Aperitif", supplier: "Campari Group",
  },
  {
    id: "p08", name: "Baileys", size_ml: 700, empty_weight_g: 490, full_weight_g: 1190,
    cost_eur: 13.99, sell_price_eur: 4.50, barcode: "5011013100132", category: "Likör", supplier: "Diageo",
  },
  {
    id: "p09", name: "Cointreau", size_ml: 700, empty_weight_g: 530, full_weight_g: 1230,
    cost_eur: 22.99, sell_price_eur: 5.00, barcode: "3035542004589", category: "Likör", supplier: "Remy Cointreau",
  },
  {
    id: "p10", name: "Bacardi", size_ml: 700, empty_weight_g: 420, full_weight_g: 1120,
    cost_eur: 11.49, sell_price_eur: 3.50, barcode: "5010677014205", category: "Rum", supplier: "Bacardi Ltd",
  },
  {
    id: "p11", name: "Tequila Patron", size_ml: 750, empty_weight_g: 600, full_weight_g: 1350,
    cost_eur: 39.99, sell_price_eur: 9.00, barcode: "7210289456345", category: "Tequila", supplier: "Patron Spirits",
  },
  {
    id: "p12", name: "Bombay Sapphire", size_ml: 700, empty_weight_g: 510, full_weight_g: 1210,
    cost_eur: 18.99, sell_price_eur: 5.50, barcode: "5010677714006", category: "Gin", supplier: "Bacardi Ltd",
  },
];

const bottles = [
  // nueva (3)
  { id: "b01", product_id: "p01", custom_name: "Absolut #3", status: "nueva", current_weight_g: 1150, bottle_number: 3 },
  { id: "b02", product_id: "p11", custom_name: "Patron #2", status: "nueva", current_weight_g: 1350, bottle_number: 2 },
  { id: "b03", product_id: "p09", custom_name: "Cointreau #2", status: "nueva", current_weight_g: 1230, bottle_number: 2 },
  // aktiv (15)
  { id: "b04", product_id: "p01", custom_name: "Absolut #1", status: "aktiv", current_weight_g: 780, bottle_number: 1 },
  { id: "b05", product_id: "p01", custom_name: "Absolut #2", status: "aktiv", current_weight_g: 950, bottle_number: 2 },
  { id: "b06", product_id: "p02", custom_name: "Hendricks #1", status: "aktiv", current_weight_g: 920, bottle_number: 1 },
  { id: "b07", product_id: "p03", custom_name: "Havana #1", status: "aktiv", current_weight_g: 850, bottle_number: 1 },
  { id: "b08", product_id: "p04", custom_name: "Jack #1", status: "aktiv", current_weight_g: 1050, bottle_number: 1 },
  { id: "b09", product_id: "p05", custom_name: "Jager #1", status: "aktiv", current_weight_g: 700, bottle_number: 1 },
  { id: "b10", product_id: "p06", custom_name: "Aperol #1", status: "aktiv", current_weight_g: 980, bottle_number: 1 },
  { id: "b11", product_id: "p07", custom_name: "Campari #1", status: "aktiv", current_weight_g: 650, bottle_number: 1 },
  { id: "b12", product_id: "p08", custom_name: "Baileys #1", status: "aktiv", current_weight_g: 1100, bottle_number: 1 },
  { id: "b13", product_id: "p09", custom_name: "Cointreau #1", status: "aktiv", current_weight_g: 880, bottle_number: 1 },
  { id: "b14", product_id: "p10", custom_name: "Bacardi #1", status: "aktiv", current_weight_g: 760, bottle_number: 1 },
  { id: "b15", product_id: "p11", custom_name: "Patron #1", status: "aktiv", current_weight_g: 900, bottle_number: 1 },
  { id: "b16", product_id: "p12", custom_name: "Bombay #1", status: "aktiv", current_weight_g: 1050, bottle_number: 1 },
  { id: "b17", product_id: "p02", custom_name: "Hendricks #2", status: "aktiv", current_weight_g: 1200, bottle_number: 2 },
  { id: "b18", product_id: "p04", custom_name: "Jack #2", status: "aktiv", current_weight_g: 620, bottle_number: 2 },
  // leer (5)
  { id: "b19", product_id: "p03", custom_name: "Havana #old", status: "leer", current_weight_g: 465, bottle_number: 0 },
  { id: "b20", product_id: "p05", custom_name: "Jager #old1", status: "leer", current_weight_g: 505, bottle_number: 0 },
  { id: "b21", product_id: "p06", custom_name: "Aperol #old", status: "leer", current_weight_g: 445, bottle_number: 0 },
  { id: "b22", product_id: "p10", custom_name: "Bacardi #old", status: "leer", current_weight_g: 425, bottle_number: 0 },
  { id: "b23", product_id: "p08", custom_name: "Baileys #old", status: "leer", current_weight_g: 495, bottle_number: 0 },
  // terminada (2)
  { id: "b24", product_id: "p01", custom_name: "Absolut #old", status: "terminada", current_weight_g: 450, bottle_number: 0 },
  { id: "b25", product_id: "p07", custom_name: "Campari #old", status: "terminada", current_weight_g: 470, bottle_number: 0 },
];

const now = Date.now();
const hour = 3600000;
const day = 86400000;

const inventory_records = [
  { id: "ir01", bottle_id: "b04", weight_g: 1150, measured_by: "demo", timestamp: new Date(now - 14 * day).toISOString() },
  { id: "ir02", bottle_id: "b04", weight_g: 1020, measured_by: "demo", timestamp: new Date(now - 10 * day).toISOString() },
  { id: "ir03", bottle_id: "b04", weight_g: 920, measured_by: "demo", timestamp: new Date(now - 7 * day).toISOString() },
  { id: "ir04", bottle_id: "b04", weight_g: 780, measured_by: "demo", timestamp: new Date(now - 2 * day).toISOString() },
  { id: "ir05", bottle_id: "b05", weight_g: 1150, measured_by: "demo", timestamp: new Date(now - 5 * day).toISOString() },
  { id: "ir06", bottle_id: "b05", weight_g: 950, measured_by: "demo", timestamp: new Date(now - 1 * day).toISOString() },
  { id: "ir07", bottle_id: "b06", weight_g: 1280, measured_by: "demo", timestamp: new Date(now - 8 * day).toISOString() },
  { id: "ir08", bottle_id: "b06", weight_g: 920, measured_by: "demo", timestamp: new Date(now - 2 * day).toISOString() },
  { id: "ir09", bottle_id: "b07", weight_g: 1160, measured_by: "demo", timestamp: new Date(now - 6 * day).toISOString() },
  { id: "ir10", bottle_id: "b07", weight_g: 850, measured_by: "demo", timestamp: new Date(now - 1 * day).toISOString() },
  { id: "ir11", bottle_id: "b08", weight_g: 1220, measured_by: "demo", timestamp: new Date(now - 4 * day).toISOString() },
  { id: "ir12", bottle_id: "b08", weight_g: 1050, measured_by: "demo", timestamp: new Date(now - 1 * day).toISOString() },
  { id: "ir13", bottle_id: "b09", weight_g: 1200, measured_by: "demo", timestamp: new Date(now - 9 * day).toISOString() },
  { id: "ir14", bottle_id: "b09", weight_g: 700, measured_by: "demo", timestamp: new Date(now - 3 * day).toISOString() },
  { id: "ir15", bottle_id: "b11", weight_g: 1170, measured_by: "demo", timestamp: new Date(now - 7 * day).toISOString() },
  { id: "ir16", bottle_id: "b11", weight_g: 650, measured_by: "demo", timestamp: new Date(now - 2 * day).toISOString() },
  { id: "ir17", bottle_id: "b14", weight_g: 1120, measured_by: "demo", timestamp: new Date(now - 5 * day).toISOString() },
  { id: "ir18", bottle_id: "b14", weight_g: 760, measured_by: "demo", timestamp: new Date(now - 1 * day).toISOString() },
  { id: "ir19", bottle_id: "b15", weight_g: 1350, measured_by: "demo", timestamp: new Date(now - 3 * day).toISOString() },
  { id: "ir20", bottle_id: "b15", weight_g: 900, measured_by: "demo", timestamp: new Date(now - 6 * hour).toISOString() },
];

const snapshot1_time = new Date(now - 7 * day).toISOString();
const snapshot2_time = new Date(now - 1 * day).toISOString();

const inventory_snapshots = [
  { id: "snap01", name: "Wocheninventur KW14", created_at: snapshot1_time },
  { id: "snap02", name: "Tagesinventur Freitag", created_at: snapshot2_time },
];

const snapshot_entries = [
  // Snapshot 1 — KW14 (7 days ago weights)
  { id: "se01", snapshot_id: "snap01", bottle_id: "b04", weight_g: 920, liquid_ml: 330, liquid_pct: 47 },
  { id: "se02", snapshot_id: "snap01", bottle_id: "b06", weight_g: 1100, liquid_ml: 520, liquid_pct: 74 },
  { id: "se03", snapshot_id: "snap01", bottle_id: "b08", weight_g: 1180, liquid_ml: 660, liquid_pct: 94 },
  { id: "se04", snapshot_id: "snap01", bottle_id: "b09", weight_g: 900, liquid_ml: 400, liquid_pct: 57 },
  { id: "se05", snapshot_id: "snap01", bottle_id: "b11", weight_g: 900, liquid_ml: 430, liquid_pct: 61 },
  { id: "se06", snapshot_id: "snap01", bottle_id: "b15", weight_g: 1200, liquid_ml: 600, liquid_pct: 80 },
  // Snapshot 2 — Freitag (1 day ago weights)
  { id: "se07", snapshot_id: "snap02", bottle_id: "b04", weight_g: 780, liquid_ml: 233, liquid_pct: 33 },
  { id: "se08", snapshot_id: "snap02", bottle_id: "b05", weight_g: 950, liquid_ml: 500, liquid_pct: 71 },
  { id: "se09", snapshot_id: "snap02", bottle_id: "b06", weight_g: 920, liquid_ml: 340, liquid_pct: 49 },
  { id: "se10", snapshot_id: "snap02", bottle_id: "b07", weight_g: 850, liquid_ml: 390, liquid_pct: 56 },
  { id: "se11", snapshot_id: "snap02", bottle_id: "b08", weight_g: 1050, liquid_ml: 530, liquid_pct: 76 },
  { id: "se12", snapshot_id: "snap02", bottle_id: "b09", weight_g: 700, liquid_ml: 200, liquid_pct: 29 },
  { id: "se13", snapshot_id: "snap02", bottle_id: "b10", weight_g: 980, liquid_ml: 540, liquid_pct: 77 },
  { id: "se14", snapshot_id: "snap02", bottle_id: "b11", weight_g: 650, liquid_ml: 180, liquid_pct: 26 },
  { id: "se15", snapshot_id: "snap02", bottle_id: "b12", weight_g: 1100, liquid_ml: 610, liquid_pct: 87 },
  { id: "se16", snapshot_id: "snap02", bottle_id: "b14", weight_g: 760, liquid_ml: 340, liquid_pct: 49 },
  { id: "se17", snapshot_id: "snap02", bottle_id: "b15", weight_g: 900, liquid_ml: 300, liquid_pct: 40 },
  { id: "se18", snapshot_id: "snap02", bottle_id: "b16", weight_g: 1050, liquid_ml: 540, liquid_pct: 77 },
];

export function seedPourfect() {
  if (isSeeded(PREFIX)) return;
  setTable(PREFIX, "products", products);
  setTable(PREFIX, "bottles", bottles);
  setTable(PREFIX, "inventory_records", inventory_records);
  setTable(PREFIX, "inventory_snapshots", inventory_snapshots);
  setTable(PREFIX, "snapshot_entries", snapshot_entries);
  markSeeded(PREFIX);
}

export const PF_PREFIX = PREFIX;
