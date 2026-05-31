import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { adminSupabase as supabase } from "@/lib/admin-supabase";

type PendingNote = {
  id: string;
  title: string;
  subject: string;
  university: string;
  author: string;
  created_at: string;
  status: string;
};

export function ModerationTab() {
  const [notes, setNotes] = useState<PendingNote[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, subject, university, author, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotes(data as PendingNote[]);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-notes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleView = async (id: string) => {
    try {
      const { data: note, error: noteError } = await supabase
        .from("notes").select("file_path").eq("id", id).maybeSingle();
      if (noteError) throw noteError;
      if (!note?.file_path) throw new Error("File not available");
      const { data: signed, error: signedError } = await supabase.storage
        .from("notes").createSignedUrl(note.file_path, 60 * 10);
      if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Could not open file");
      window.open(signed.signedUrl, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    }
  };

  const handleSet = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("notes")
        .update({ status, approved: status === "approved" })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Note ${status}`);
      setNotes((prev) => prev?.filter((n) => n.id !== id) ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      {notes === null ? (
        <div className="p-12 text-center text-muted-foreground">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          🎉 No pending notes. All caught up!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">
                  <Link to="/notes/$id" params={{ id: n.id }} className="hover:text-primary hover:underline">
                    {n.title}
                  </Link>
                </TableCell>
                <TableCell>{n.subject}</TableCell>
                <TableCell>{n.university}</TableCell>
                <TableCell className="text-muted-foreground">{n.author}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleView(n.id)}>
                      <ExternalLink className="h-3.5 w-3.5" /> View PDF
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busyId === n.id}
                      onClick={() => handleSet(n.id, "approved")}
                    >
                      {busyId === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={busyId === n.id}
                      onClick={() => handleSet(n.id, "rejected")}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
