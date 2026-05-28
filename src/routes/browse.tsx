import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { NoteCard } from "@/components/notes/NoteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subjects, universities, type Note } from "@/lib/mock-data";
import { fetchNotes } from "@/lib/notes-api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/browse")({
  component: Browse,
  head: () => ({
    meta: [
      { title: "Browse Notes — NotesKhuji" },
      { name: "description", content: "Browse thousands of university notes by subject, university and topic." },
    ],
  }),
});

function Browse() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [uni, setUni] = useState<string | null>(null);
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const uniShort = useMemo(
    () => (uni ? universities.find((u) => u.slug === uni)?.short ?? null : null),
    [uni],
  );

  useEffect(() => {
    setLoading(true);
    const run = () =>
      fetchNotes({ q, subjectSlug: subject, universityShort: uniShort, tier })
        .then(setNotes)
        .catch(console.error)
        .finally(() => setLoading(false));
    const t = setTimeout(run, 250);
    const channel = supabase
      .channel("browse-notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => run(),
      )
      .subscribe();
    return () => {
      clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, [q, subject, uniShort, tier]);

  const filtered = notes;


  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Browse Notes</h1>
          <p className="mt-2 text-muted-foreground">
            Verified notes from top Bangladeshi universities.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, subject, course code…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-8">
            <FilterGroup title="Tier">
              <div className="flex flex-wrap gap-2">
                {(["all", "free", "premium"] as const).map((t) => (
                  <Badge
                    key={t}
                    onClick={() => setTier(t)}
                    variant={tier === t ? "default" : "outline"}
                    className={`cursor-pointer capitalize ${tier === t ? "brand-gradient text-white border-0" : ""}`}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title="Subject">
              <div className="space-y-1">
                <button onClick={() => setSubject(null)} className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${!subject ? "bg-accent font-medium" : "text-muted-foreground"}`}>
                  All subjects
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => setSubject(s.slug)}
                    className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${subject === s.slug ? "bg-accent font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title="University">
              <div className="space-y-1">
                <button onClick={() => setUni(null)} className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${!uni ? "bg-accent font-medium" : "text-muted-foreground"}`}>
                  All universities
                </button>
                {universities.map((u) => (
                  <button
                    key={u.slug}
                    onClick={() => setUni(u.slug)}
                    className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${uni === u.slug ? "bg-accent font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    {u.short}
                  </button>
                ))}
              </div>
            </FilterGroup>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} results</span>
              <Link to="/upload" className="text-primary hover:underline">+ Upload your notes</Link>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Loading notes…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No notes match your filters.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((n) => <NoteCard key={n.id} note={n} />)}
              </div>
            )}

          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
