import { isSeeded, markSeeded, setTable } from "../storage";

const PREFIX = "pk";

const settings = [
  {
    id: "s01",
    pickup_slot_minutes: 15,
    min_prep_minutes: 20,
    kitchen_close_time: "22:00:00",
    currency: "EUR",
    happy_hour_burger_price: 6.0,
    happy_hour_start: "17:00:00",
    happy_hour_end: "19:00:00",
    timezone: "Europe/Berlin",
  },
];

const menuItems = [
  { id: "m01", name: "Classic Burger", category: "Burger", price_eur: 8.9, available: true, is_burger: true, description: "Rindfleisch, Salat, Tomate, Zwiebel, Hausgemachte Sauce" },
  { id: "m02", name: "Cheese Burger", category: "Burger", price_eur: 9.9, available: true, is_burger: true, description: "Rindfleisch, Cheddar, Salat, Tomate, Zwiebel" },
  { id: "m03", name: "BBQ Burger", category: "Burger", price_eur: 10.9, available: true, is_burger: true, description: "Rindfleisch, BBQ-Sauce, Bacon, Cheddar, Crispy Onions" },
  { id: "m04", name: "Chicken Burger", category: "Burger", price_eur: 9.9, available: true, is_burger: true, description: "Knuspriges Hähnchen, Salat, Mayo, Eingelegte Gurken" },
  { id: "m05", name: "Veggie Burger", category: "Burger", price_eur: 9.5, available: true, is_burger: true, description: "Gemüse-Patty, Avocado, Salat, Joghurt-Sauce" },
  { id: "m06", name: "Spezial Burger", category: "Burger", price_eur: 12.9, available: true, is_burger: true, description: "Wochenkarte — frag an der Theke!" },
  { id: "m07", name: "Pommes", category: "Beilagen", price_eur: 4.5, available: true, is_burger: false, description: "Knusprige Pommes Frites" },
  { id: "m08", name: "Pommes klein (Burger Add-on)", category: "Beilagen", price_eur: 2.8, available: true, is_burger: false, description: null },
  { id: "m09", name: "Süßkartoffel Pommes", category: "Beilagen", price_eur: 5.5, available: true, is_burger: false, description: "Mit Meersalz" },
  { id: "m10", name: "Onion Rings", category: "Beilagen", price_eur: 4.9, available: true, is_burger: false, description: "Knusprig paniert" },
  { id: "m11", name: "Coleslaw", category: "Beilagen", price_eur: 3.5, available: true, is_burger: false, description: "Hausgemacht" },
  { id: "m12", name: "Currywurst mit Pommes", category: "Gerichte", price_eur: 8.5, available: true, is_burger: false, description: "Bratwurst mit Currysauce und Pommes" },
  { id: "m13", name: "Caesar Salat", category: "Salat", price_eur: 8.9, available: true, is_burger: false, description: "Römersalat, Croutons, Parmesan, Caesar-Dressing" },
  { id: "m14", name: "Gemischter Salat", category: "Salat", price_eur: 7.5, available: true, is_burger: false, description: "Blattsalat, Tomaten, Gurke, Möhren" },
  { id: "m15", name: "Halloumi Salat", category: "Salat", price_eur: 9.9, available: true, is_burger: false, description: "Gegrillter Halloumi, Rucola, Walnüsse, Honig-Dressing" },
  { id: "m16", name: "Softdrink 0.33l", category: "Getränke", price_eur: 2.9, available: true, is_burger: false, description: "Cola, Fanta, Sprite, Wasser" },
  { id: "m17", name: "Hausgemachte Limo", category: "Getränke", price_eur: 3.9, available: true, is_burger: false, description: "Zitrone-Minze oder Ingwer-Orange" },
  { id: "m18", name: "Bier vom Fass 0.5l", category: "Getränke", price_eur: 4.5, available: true, is_burger: false, description: null },
  { id: "m19", name: "Brownie", category: "Dessert", price_eur: 4.5, available: true, is_burger: false, description: "Warmer Schokobrownie mit Vanilleeis" },
  { id: "m20", name: "Cheesecake", category: "Dessert", price_eur: 5.5, available: true, is_burger: false, description: "New York Style" },
];

const orders = [
  { id: "o01", customer_name: "Max M.", phone: "0151-1234567", status: "completed", total_eur: 21.8, currency: "EUR", items: [{ id: "m01", name: "Classic Burger", quantity: 1, price_eur: 8.9 }, { id: "m07", name: "Pommes (Ketchup)", quantity: 1, price_eur: 4.5 }, { id: "m16", name: "Softdrink 0.33l", quantity: 2, price_eur: 2.9 }, { id: "m19", name: "Brownie", quantity: 1, price_eur: 4.5 }], pickup_slot: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), notes: "" },
  { id: "o02", customer_name: "Anna S.", phone: "0176-9876543", status: "completed", total_eur: 19.8, currency: "EUR", items: [{ id: "m02", name: "Cheese Burger + Pommes (klein, Ketchup)", quantity: 1, price_eur: 12.7 }, { id: "m13", name: "Caesar Salat (Joghurt)", quantity: 1, price_eur: 8.9 }], pickup_slot: new Date(Date.now() - 172800000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), notes: "Keine Zwiebeln bitte" },
  { id: "o03", customer_name: "Tom K.", phone: "0171-5551234", status: "completed", total_eur: 30.2, currency: "EUR", items: [{ id: "m03", name: "BBQ Burger", quantity: 2, price_eur: 10.9 }, { id: "m18", name: "Bier vom Fass 0.5l", quantity: 2, price_eur: 4.5 }], pickup_slot: new Date(Date.now() - 259200000).toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), notes: "" },
  { id: "o04", customer_name: "Lisa B.", phone: "0162-4443333", status: "pending", total_eur: 15.4, currency: "EUR", items: [{ id: "m05", name: "Veggie Burger", quantity: 1, price_eur: 9.5 }, { id: "m17", name: "Hausgemachte Limo", quantity: 1, price_eur: 3.9 }], pickup_slot: new Date(Date.now() + 3600000).toISOString(), created_at: new Date(Date.now() - 1800000).toISOString(), notes: "Laktoseintolerant" },
  { id: "o05", customer_name: "Jan R.", phone: "0157-8889999", status: "completed", total_eur: 24.3, currency: "EUR", items: [{ id: "m04", name: "Chicken Burger", quantity: 1, price_eur: 9.9 }, { id: "m09", name: "Süßkartoffel Pommes", quantity: 1, price_eur: 5.5 }, { id: "m20", name: "Cheesecake", quantity: 1, price_eur: 5.5 }, { id: "m16", name: "Softdrink 0.33l", quantity: 1, price_eur: 2.9 }], pickup_slot: new Date(Date.now() - 43200000).toISOString(), created_at: new Date(Date.now() - 43200000).toISOString(), notes: "" },
];

export function seedPickup() {
  if (isSeeded(PREFIX)) return;
  setTable(PREFIX, "settings", settings);
  setTable(PREFIX, "menu_items", menuItems);
  setTable(PREFIX, "orders", orders);
  markSeeded(PREFIX);
}

export const PK_PREFIX = PREFIX;
