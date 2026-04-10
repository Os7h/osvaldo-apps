import { MockDB } from "@/lib/mock-db";
import { GM_PREFIX, seedGlasMeister } from "@/lib/mock-db/seed/glasmeister";

// Seed on first import
seedGlasMeister();

export const supabase = new MockDB(GM_PREFIX);
