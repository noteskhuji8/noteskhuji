import { supabase } from "@/integrations/supabase/client";

// Reuse the app's primary browser client so admin routes read the same
// authenticated session and role claims as the rest of the dashboard.
export const adminSupabase = supabase;

export const PLATFORM_COMMISSION = 0.2; // 20%
export const AUTHOR_SHARE = 1 - PLATFORM_COMMISSION;
export const CURRENCY = "BDT";

export function formatMoney(n: number) {
  return `${CURRENCY} ${Math.round(n).toLocaleString()}`;
}
