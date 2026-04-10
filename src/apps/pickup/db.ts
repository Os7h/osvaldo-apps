import { MockDB } from "@/lib/mock-db";
import { PK_PREFIX, seedPickup } from "@/lib/mock-db/seed/pickup";

seedPickup();

export const supabase = new MockDB(PK_PREFIX);
