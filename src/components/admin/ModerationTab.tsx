import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Check, X, Loader2, CheckCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminSupabase as supabase } from "@/lib/admin-supabase";

type PendingNote = {
  id: string; title: string; subject: string; university: string;
  author: string; created_at: string; status: string;
};

export function ModerationTab() {
  const [notes, setNotes] = useState<PendingNote[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, subject, university, author, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setNotes(data as PendingNote[]);
    setSelected(new Set());
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel("admin-notes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const openPreview = async (id: string, title: string) => {
    try {
      const { data: note, error } = await supabase.from("notes").select("file_path").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!note?.file_path) throw new Error("File not available");
      const { data: signed, error: sErr } = await supabase.storage.from("notes")
        .createSignedUrl(note.file_path, 60 * 10);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Could not open file");
      setPreviewUrl(signed.signedUrl); setPreviewTitle(title);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not open file"); }
  };

  const setStatus = async (ids: string[], status: "approved" | "rejected") => {
    const { error } = await supabase.from("notes")
      .update({ status, approved: status === "approved" })
      .in("id", ids);
    if (error) throw error;
  };

  const handleSet = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await setStatus([id], status);
      toast.success(`Note ${status}`);
      setNotes((prev) => prev?.filter((n) => n.id !== id) ?? null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusyId(null); }
  };

  const handleBulk = async (status: "approved" | "rejected") => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await setStatus([...selected], status);
      toast.success(`${selected.size} notes ${status}`);
      setNotes((prev) => prev?.filter((n) => !selected.has(n.id)) ?? null);
      setSelected(new Set());
    } catch (e) { toast.error(e instanceof Error ? e.message : "Bulk update failed"); }
    finally { setBulkBusy(false); }
  };

  const allSelected = useMemo(
    () => (notes && notes.length > 0 ? notes.every((n) => selected.has(n.id)) : false),
    [notes, selected],
  );
  const toggleAll = () => {
    if (!notes) return;
    setSelected(allSelected ? new Set() : new Set(notes.map((n) => n.id)));
  };
  const toggle = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="rounded-2xl border border-border bg-card">
        {notes === null ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">🎉 No pending notes. All caught up!</div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                <p className="text-sm">{selected.size} selected</p>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={bulkBusy} onClick={() => handleBulk("approved")}>
                    {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />} Approve selected
                  </Button>
                  <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={() => handleBulk("rejected")}>
                    <X className="h-3.5 w-3.5" /> Reject selected
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Subject</TableHead>
                  <TableHead className="hidden md:table-cell">University</TableHead>
                  <TableHead className="hidden lg:table-cell">Author</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell><Checkbox checked={selected.has(n.id)} onCheckedChange={() => toggle(n.id)} /></TableCell>
                    <TableCell className="font-medium">
                      <Link to="/notes/$id" params={{ id: n.id }} className="hover:text-primary hover:underline">{n.title}</Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{n.subject}</TableCell>
                    <TableCell className="hidden md:table-cell">{n.university}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{n.author}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openPreview(n.id, n.title)}>
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={busyId === n.id} onClick={() => handleSet(n.id, "approved")}>
                          {busyId === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" disabled={busyId === n.id} onClick={() => handleSet(n.id, "rejected")}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="truncate">{previewTitle}</span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Open in new tab
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} title="PDF preview" className="h-[70vh] w-full rounded border border-border" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
