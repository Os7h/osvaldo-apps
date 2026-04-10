import { isSeeded, markSeeded, setTable } from "../storage";

const PREFIX = "gm";

const glasses = [
  { id: "g01", category: "Wein", name: "Rotweinglas 350ml", bar_target: 20, bar_count: 14, missing: 6, storage_count: 45, reorder_threshold: 15 },
  { id: "g02", category: "Wein", name: "Weißweinglas 250ml", bar_target: 20, bar_count: 18, missing: 2, storage_count: 38, reorder_threshold: 15 },
  { id: "g03", category: "Wein", name: "Champagnerflöte", bar_target: 12, bar_count: 10, missing: 2, storage_count: 22, reorder_threshold: 10 },
  { id: "g04", category: "Bier", name: "Pilsglas 0.3L", bar_target: 25, bar_count: 25, missing: 0, storage_count: 60, reorder_threshold: 20 },
  { id: "g05", category: "Bier", name: "Pilsglas 0.5L", bar_target: 30, bar_count: 22, missing: 8, storage_count: 55, reorder_threshold: 20 },
  { id: "g06", category: "Bier", name: "Weizenglas 0.5L", bar_target: 15, bar_count: 13, missing: 2, storage_count: 30, reorder_threshold: 10 },
  { id: "g07", category: "Bier", name: "Bierkrug 0.5L", bar_target: 20, bar_count: 20, missing: 0, storage_count: 8, reorder_threshold: 10 },
  { id: "g08", category: "Cocktail", name: "Cocktailschale", bar_target: 12, bar_count: 8, missing: 4, storage_count: 18, reorder_threshold: 8 },
  { id: "g09", category: "Cocktail", name: "Highball", bar_target: 18, bar_count: 15, missing: 3, storage_count: 35, reorder_threshold: 12 },
  { id: "g10", category: "Cocktail", name: "Tumbler / Old Fashioned", bar_target: 15, bar_count: 15, missing: 0, storage_count: 28, reorder_threshold: 10 },
  { id: "g11", category: "Cocktail", name: "Margarita-Glas", bar_target: 8, bar_count: 6, missing: 2, storage_count: 12, reorder_threshold: 5 },
  { id: "g12", category: "Cocktail", name: "Hurricane-Glas", bar_target: 8, bar_count: 8, missing: 0, storage_count: 14, reorder_threshold: 5 },
  { id: "g13", category: "Shots", name: "Shotglas 2cl", bar_target: 25, bar_count: 19, missing: 6, storage_count: 50, reorder_threshold: 20 },
  { id: "g14", category: "Shots", name: "Shotglas 4cl", bar_target: 15, bar_count: 15, missing: 0, storage_count: 32, reorder_threshold: 10 },
  { id: "g15", category: "Longdrink", name: "Longdrinkglas", bar_target: 20, bar_count: 16, missing: 4, storage_count: 40, reorder_threshold: 15 },
  { id: "g16", category: "Heißgetränke", name: "Kaffeetasse + Untertasse", bar_target: 15, bar_count: 12, missing: 3, storage_count: 25, reorder_threshold: 10 },
  { id: "g17", category: "Heißgetränke", name: "Teetasse + Untertasse", bar_target: 10, bar_count: 10, missing: 0, storage_count: 18, reorder_threshold: 8 },
  { id: "g18", category: "Wasser", name: "Wasserglas", bar_target: 30, bar_count: 24, missing: 6, storage_count: 5, reorder_threshold: 15 },
];

const inventoryHistory = [
  { id: "h01", glass_id: "g01", bar_count: 14, storage_count: 45, missing: 6, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "h02", glass_id: "g05", bar_count: 22, storage_count: 55, missing: 8, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "h03", glass_id: "g13", bar_count: 19, storage_count: 50, missing: 6, timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: "h04", glass_id: "g08", bar_count: 8, storage_count: 18, missing: 4, timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: "h05", glass_id: "g18", bar_count: 24, storage_count: 5, missing: 6, timestamp: new Date(Date.now() - 259200000).toISOString() },
];

export function seedGlasMeister() {
  if (isSeeded(PREFIX)) return;
  setTable(PREFIX, "glasses", glasses);
  setTable(PREFIX, "inventory_history", inventoryHistory);
  markSeeded(PREFIX);
}

export const GM_PREFIX = PREFIX;
