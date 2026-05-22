import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { NoteCard } from "@/components/notes/NoteCard";
import { notes, subjects } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/subjects/$slug")({
  component: SubjectPage,
  loader: ({ params }) => {
    const subject = subjects.find((s) => s.slug === params.slug);
    if (!subject) throw notFound();
    return { subject };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.subject.name ?? "Subject"} Notes — NotesKhuji` },
      { name: "description", content: `Browse the best ${loaderData?.subject.name} notes from Bangladeshi universities.` },
    ],
  }),
});

function SubjectPage() {
  const { subject } = Route.useLoaderData();
  const filtered = notes.filter((n) => n.subjectSlug === subject.slug);
  return (
    <SiteShell>
      <section className={`relative overflow-hidden bg-gradient-to-br ${subject.color} text-white`}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{subject.name}</h1>
          <p className="mt-3 max-w-2xl text-white/85">
            {subject.count.toLocaleString()} notes available — from intro courses to advanced electives, contributed by students across Bangladesh.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">All {subject.name} notes</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((n) => <NoteCard key={n.id} note={n} />)}
          {filtered.length === 0 && (
            <p className="text-muted-foreground">No notes uploaded yet. Be the first!</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
