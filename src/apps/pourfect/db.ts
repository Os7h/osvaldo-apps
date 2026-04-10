import { MockDB } from "@/lib/mock-db";
import { PF_PREFIX, seedPourfect } from "@/lib/mock-db/seed/pourfect";

// Seed on first import
seedPourfect();

export const supabase = new MockDB(PF_PREFIX);

// Register RPC: calculate liquid remaining from weight
supabase.registerRpc(
  "calculate_liquid_remaining",
  (args: Record<string, unknown>) => {
    const currentWeight = args.current_weight as number;
    const emptyWeight = args.empty_weight as number;
    const fullWeight = args.full_weight as number;
    const sizeMl = args.size_ml as number;

    if (fullWeight <= emptyWeight) {
      return { liquid_ml: 0, liquid_percentage: 0 };
    }

    const rawMl =
      ((currentWeight - emptyWeight) / (fullWeight - emptyWeight)) * sizeMl;
    const liquid_ml = Math.round(Math.max(0, Math.min(sizeMl, rawMl)));
    const liquid_percentage = Math.round((liquid_ml / sizeMl) * 100);

    return { liquid_ml, liquid_percentage };
  }
);
