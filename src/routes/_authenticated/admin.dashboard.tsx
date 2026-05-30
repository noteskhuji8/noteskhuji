import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!envUrl || !envAnonKey) {
  throw new Error(
    "Missing Supabase environment variable(s): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.",
  );
}

const supabase = createClient<Database>(envUrl, envAnonKey, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

type PendingNote = {
  id: string;
  title: string;
  subject: string;
  university: string;
  author: string;
  created_at: string;
  status: string;
};

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NotesKhuji" }] }),
  beforeLoad: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) throw redirect({ to: "/login" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAuth();
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
    if (!user) return;
    void load();
    const channel = supabase
      .channel("admin-notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleView = async (id: string) => {
    try {
      const { data: note, error: noteError } = await supabase
        .from("notes")
        .select("file_path")
        .eq("id", id)
        .maybeSingle();
      if (noteError) throw noteError;
      if (!note?.file_path) throw new Error("File not available");

      const { data: signed, error: signedError } = await supabase.storage
        .from("notes")
        .createSignedUrl(note.file_path, 60 * 10);
      if (signedError || !signed?.signedUrl) {
        throw signedError ?? new Error("Could not open file");
      }

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
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            <ShieldCheck className="mr-1 h-3 w-3" /> Admin
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Notes moderation queue
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review pending submissions and approve or reject them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
                      <Link
                        to="/notes/$id"
                        params={{ id: n.id }}
                        className="hover:text-primary hover:underline"
                      >
                        {n.title}
                      </Link>
                    </TableCell>
                    <TableCell>{n.subject}</TableCell>
                    <TableCell>{n.university}</TableCell>
                    <TableCell className="text-muted-foreground">{n.author}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleView(n.id)}
                        >
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
      </section>
    </SiteShell>
  );
}
