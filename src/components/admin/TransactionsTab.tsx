import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { adminSupabase as supabase, formatMoney } from "@/lib/admin-supabase";

type Tx = {
  id: string;
  user_id: string;
  note_id: string;
  amount: number;
  created_at: string;
};

type Enriched = Tx & {
  buyer: string;
  noteTitle: string;
};

export function TransactionsTab() {
  const [rows, setRows] = useState<Enriched[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("id, user_id, note_id, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        toast.error(error.message);
        return;
      }
      const noteIds = Array.from(new Set((purchases ?? []).map((p) => p.note_id)));
      const userIds = Array.from(new Set((purchases ?? []).map((p) => p.user_id)));
      const [notesRes, profilesRes] = await Promise.all([
        noteIds.length
          ? supabase.from("notes").select("id, title").in("id", noteIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[], error: null }),
        userIds.length
          ? supabase.from("profiles").select("id, full_name").in("id", userIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[], error: null }),
      ]);
      const titles = new Map((notesRes.data ?? []).map((n) => [n.id, n.title]));
      const buyers = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? ""]));
      setRows(
        (purchases ?? []).map((p) => ({
          ...p,
          noteTitle: titles.get(p.note_id) ?? "—",
          buyer: buyers.get(p.user_id) || p.user_id.slice(0, 8) + "…",
        })),
      );
    })();
  }, []);

  const csv = useMemo(() => {
    if (!rows) return "";
    const header = ["Order ID", "Buyer", "Buyer ID", "Note Title", "Note ID", "Price", "Timestamp", "Status"];
    const lines = rows.map((r) =>
      [r.id, r.buyer, r.user_id, r.noteTitle, r.note_id, r.amount, r.created_at, "success"]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    return [header.join(","), ...lines].join("\n");
  }, [rows]);

  const exportCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing the last {rows?.length ?? 0} transactions.
        </p>
        <Button size="sm" variant="outline" className="gap-2" onClick={exportCsv} disabled={!rows?.length}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {rows === null ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No transactions yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}…</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.noteTitle}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                      Success
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
