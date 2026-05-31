import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  adminSupabase as supabase, AUTHOR_SHARE, formatMoney,
} from "@/lib/admin-supabase";

type Row = {
  author_id: string;
  author_name: string;
  uploaded: number;
  sold: number;
  gross: number; // total purchase amount attributed to this author's notes
  earned: number; // author share
  paid: number;
  unpaid: number;
  noteIds: string[];
};

export function PayoutsTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);

  const load = async () => {
    const [notesRes, purchasesRes, profilesRes, payoutsRes] = await Promise.all([
      supabase.from("notes").select("id, user_id, author"),
      supabase.from("purchases").select("note_id, amount"),
      supabase.from("profiles").select("id, full_name"),
      (supabase.from("payout_history" as never) as never as {
        select: (c: string) => Promise<{ data: { author_id: string; amount: number }[] | null; error: unknown }>;
      }).select("author_id, amount"),
    ]);
    if (notesRes.error) return toast.error(notesRes.error.message);
    if (purchasesRes.error) return toast.error(purchasesRes.error.message);

    const profileName = new Map<string, string>(
      (profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? ""]),
    );
    const paidByAuthor = new Map<string, number>();
    for (const r of payoutsRes.data ?? []) {
      paidByAuthor.set(r.author_id, (paidByAuthor.get(r.author_id) ?? 0) + (r.amount || 0));
    }

    const noteMap = new Map<string, { user_id: string | null; author: string }>();
    const byAuthor = new Map<string, Row>();
    for (const n of notesRes.data ?? []) {
      noteMap.set(n.id, { user_id: n.user_id, author: n.author });
      if (!n.user_id) continue;
      const existing = byAuthor.get(n.user_id) ?? {
        author_id: n.user_id,
        author_name: profileName.get(n.user_id) || n.author || "Unknown",
        uploaded: 0, sold: 0, gross: 0, earned: 0, paid: 0, unpaid: 0, noteIds: [],
      };
      existing.uploaded += 1;
      existing.noteIds.push(n.id);
      byAuthor.set(n.user_id, existing);
    }

    for (const p of purchasesRes.data ?? []) {
      const note = noteMap.get(p.note_id);
      if (!note?.user_id) continue;
      const row = byAuthor.get(note.user_id);
      if (!row) continue;
      row.sold += 1;
      row.gross += p.amount || 0;
    }

    for (const row of byAuthor.values()) {
      row.earned = Math.round(row.gross * AUTHOR_SHARE);
      row.paid = paidByAuthor.get(row.author_id) ?? 0;
      row.unpaid = Math.max(0, row.earned - row.paid);
    }

    setRows(
      Array.from(byAuthor.values()).sort((a, b) => b.unpaid - a.unpaid),
    );
  };

  useEffect(() => { void load(); }, []);

  const markPaid = async (row: Row) => {
    setBusy(row.author_id);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const paidBy = sess.user?.id;
      if (!paidBy) throw new Error("Not signed in");
      const { error } = await (supabase.from("payout_history" as never) as never as {
        insert: (v: unknown) => Promise<{ error: { message: string } | null }>;
      }).insert({
        author_id: row.author_id,
        amount: row.unpaid,
        note_ids: row.noteIds,
        paid_by: paidBy,
        notes: `Manual payout of ${formatMoney(row.unpaid)}`,
      });
      if (error) throw new Error(error.message);
      toast.success(`Marked ${formatMoney(row.unpaid)} as paid to ${row.author_name}`);
      setConfirmRow(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record payout");
    } finally {
      setBusy(null);
    }
  };

  const totalUnpaid = useMemo(
    () => rows?.reduce((s, r) => s + r.unpaid, 0) ?? 0,
    [rows],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Author earnings are calculated as {Math.round(AUTHOR_SHARE * 100)}% of gross purchase revenue.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Total outstanding: <span className="font-semibold">{formatMoney(totalUnpaid)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {rows === null ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No authors yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Uploaded</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Gross Revenue</TableHead>
                <TableHead className="text-right">Unpaid Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.author_id}>
                  <TableCell>
                    <div className="font-medium">{r.author_name}</div>
                    <div className="text-xs text-muted-foreground">{r.author_id.slice(0, 8)}…</div>
                  </TableCell>
                  <TableCell className="text-right">{r.uploaded}</TableCell>
                  <TableCell className="text-right">{r.sold}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.gross)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(r.unpaid)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={r.unpaid <= 0 || busy === r.author_id}
                      onClick={() => setConfirmRow(r)}
                    >
                      {busy === r.author_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Mark as Paid"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payout</AlertDialogTitle>
            <AlertDialogDescription>
              Record a payout of{" "}
              <span className="font-semibold">{confirmRow ? formatMoney(confirmRow.unpaid) : ""}</span>{" "}
              to <span className="font-semibold">{confirmRow?.author_name}</span>? This will be
              logged in payout history and cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRow && markPaid(confirmRow)}>
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
