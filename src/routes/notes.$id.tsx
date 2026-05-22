import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { notes } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download, Star, FileText, Lock, ShieldCheck, Clock, Eye, ArrowLeft, Share2,
} from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";

export const Route = createFileRoute("/notes/$id")({
  component: NoteDetails,
  loader: ({ params }) => {
    const note = notes.find((n) => n.id === params.id);
    if (!note) throw notFound();
    return { note };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.note.title ?? "Note"} — NotesKhuji` },
      { name: "description", content: loaderData?.note.preview ?? "" },
    ],
  }),
});

function NoteDetails() {
  const { note } = Route.useLoaderData();
  const related = notes.filter((n) => n.subjectSlug === note.subjectSlug && n.id !== note.id).slice(0, 4);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${note.cover} shadow-xl`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-white/15 p-8 backdrop-blur ring-1 ring-white/30">
                  <FileText className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="absolute left-4 top-4 flex gap-2">
                {note.premium ? (
                  <Badge className="border-0 bg-white text-foreground">
                    <Lock className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-emerald-500 text-white">Free</Badge>
                )}
                <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">
                  PDF · {note.pages} pages
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link to="/subjects/$slug" params={{ slug: note.subjectSlug }} className="font-medium text-primary hover:underline">
                {note.subject}
              </Link>
              <span>·</span>
              <span>{note.university}</span>
              {note.tags.map((t) => (
                <Badge key={t} variant="outline" className="ml-1">{t}</Badge>
              ))}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{note.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {note.rating.toFixed(1)} rating
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> {note.downloads.toLocaleString()} downloads
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Updated 2 weeks ago
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">About these notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note.preview}</p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Admin verified quality</li>
                <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Searchable PDF</li>
                <li className="flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Instant download</li>
                <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> 5-page free preview</li>
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold">Preview</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${note.cover} opacity-90 ring-1 ring-border`}>
                    <div className="flex h-full items-end justify-end p-3">
                      <span className="rounded bg-black/40 px-2 py-0.5 text-xs text-white">Page {i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">
                  {note.price === 0 ? "Free" : `৳${note.price}`}
                </span>
                {note.premium && <span className="text-sm text-muted-foreground line-through">৳{note.price + 100}</span>}
              </div>
              <Button className="brand-gradient mt-5 w-full text-white shadow-md" size="lg">
                {note.price === 0 ? <><Download className="mr-2 h-4 w-4" /> Download PDF</> : <><Lock className="mr-2 h-4 w-4" /> Purchase & download</>}
              </Button>
              <Button variant="outline" className="mt-2 w-full" size="lg">
                <Eye className="mr-2 h-4 w-4" /> Free preview
              </Button>
              <Button variant="ghost" className="mt-2 w-full" size="sm">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>

              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full brand-gradient font-semibold text-white">
                  {note.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{note.author}</div>
                  <div className="text-xs text-muted-foreground">{note.university} · Top contributor</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold">Related notes</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((n) => <NoteCard key={n.id} note={n} />)}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
