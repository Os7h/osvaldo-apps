import { MockDB } from "@/lib/mock-db";
import { WI_PREFIX, seedWeltInventar } from "@/lib/mock-db/seed/weltinventar";

// Seed on first import
seedWeltInventar();

export const supabase = new MockDB(WI_PREFIX);
