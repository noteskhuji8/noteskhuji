import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  DollarSign, TrendingUp, Wallet, ShoppingBag, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminSupabase as supabase, PLATFORM_COMMISSION, AUTHOR_SHARE, formatMoney,
} from "@/lib/admin-supabase";

type Purchase = { id: string; note_id: string; amount: number; created_at: string };
type NoteLite = { id: string; subject: string; university: string; user_id: string | null };

type Granularity = "day" | "week" | "month";

export type AnalyticsData = {
  purchases: Purchase[];
  notes: NoteLite[];
  totalPaidOut: number;
};

function bucketKey(d: Date, g: Granularity) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  if (g === "day") return `${y}-${m}-${day}`;
  if (g === "month") return `${y}-${m}`;
  // week (ISO-ish): year + week number
  const t = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function AnalyticsTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  const [granularity, setGranularity] = useState<Granularity>("day");

  const kpis = useMemo(() => {
    if (!data) return null;
    const totalRevenue = data.purchases.reduce((s, p) => s + (p.amount || 0), 0);
    const commission = totalRevenue * PLATFORM_COMMISSION;
    const authorEarnings = totalRevenue * AUTHOR_SHARE;
    const outstanding = Math.max(0, authorEarnings - data.totalPaidOut);
    return {
      totalRevenue,
      commission,
      outstanding,
      purchaseCount: data.purchases.length,
    };
  }, [data]);

  const series = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const p of data.purchases) {
      const k = bucketKey(new Date(p.created_at), granularity);
      map.set(k, (map.get(k) ?? 0) + (p.amount || 0));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([label, revenue]) => ({ label, revenue }));
  }, [data, granularity]);

  const categories = useMemo(() => {
    if (!data) return [];
    const noteById = new Map(data.notes.map((n) => [n.id, n]));
    const subjMap = new Map<string, number>();
    for (const p of data.purchases) {
      const n = noteById.get(p.note_id);
      const key = n?.subject ?? "Unknown";
      subjMap.set(key, (subjMap.get(key) ?? 0) + (p.amount || 0));
    }
    return Array.from(subjMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [data]);

  if (loading || !kpis) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Platform Revenue"
          value={formatMoney(kpis.totalRevenue)}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={`Platform Commission (${Math.round(PLATFORM_COMMISSION * 100)}%)`}
          value={formatMoney(kpis.commission)}
        />
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Outstanding Author Payouts"
          value={formatMoney(kpis.outstanding)}
        />
        <KpiCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Premium Note Purchases"
          value={kpis.purchaseCount.toLocaleString()}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Revenue Growth Over Time</CardTitle>
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(["day", "week", "month"] as const).map((g) => (
              <Button
                key={g}
                size="sm"
                variant={granularity === g ? "default" : "ghost"}
                className="h-7 px-3 capitalize"
                onClick={() => setGranularity(g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            {series.length === 0 ? (
              <EmptyChart label="No revenue yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => formatMoney(v)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Performing Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            {categories.length === 0 ? (
              <EmptyChart label="No category data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => formatMoney(v)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

// Loader hook used by the dashboard to fetch underlying data once.
export function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [pRes, nRes, payRes] = await Promise.all([
          supabase.from("purchases").select("id, note_id, amount, created_at"),
          supabase.from("notes").select("id, subject, university, user_id"),
          (supabase.from("payout_history" as never) as never as {
            select: (c: string) => Promise<{ data: { amount: number }[] | null; error: unknown }>;
          }).select("amount"),
        ]);
        if (cancelled) return;
        if (pRes.error) throw pRes.error;
        if (nRes.error) throw nRes.error;
        const totalPaidOut = (payRes.data ?? []).reduce(
          (s: number, r: { amount: number }) => s + (r.amount || 0), 0);
        setData({
          purchases: (pRes.data ?? []) as Purchase[],
          notes: (nRes.data ?? []) as NoteLite[],
          totalPaidOut,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, refetch: () => setData((d) => d) };
}
