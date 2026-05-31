// Browser-only Supabase client used by the admin dashboard.
// Kept separate so analytics/payout tabs reuse a single GoTrue instance.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!envUrl || !envAnonKey) {
  throw new Error(
    "Missing Supabase environment variable(s): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.",
  );
}

export const adminSupabase = createClient<Database>(envUrl, envAnonKey, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "sb-admin-dashboard",
  },
});

export const PLATFORM_COMMISSION = 0.2; // 20%
export const AUTHOR_SHARE = 1 - PLATFORM_COMMISSION;
export const CURRENCY = "BDT";

export function formatMoney(n: number) {
  return `${CURRENCY} ${Math.round(n).toLocaleString()}`;
}
