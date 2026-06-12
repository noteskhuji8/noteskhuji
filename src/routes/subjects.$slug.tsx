import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { NoteCard } from "@/components/notes/NoteCard";
import { subjects, universities, type Note } from "@/lib/mock-data";
import { fetchNotes } from "@/lib/notes-api";
import { ArrowLeft, BookOpen, Download as DownloadIcon, GraduationCap } from "lucide-react";

const SITE_URL = "https://noteskhuji-bd.lovable.app";

export const Route = createFileRoute("/subjects/$slug")({
  component: SubjectPage,
  loader: async ({ params }) => {
    const subject = subjects.find((s) => s.slug === params.slug);
    if (!subject) throw notFound();
    const notes = await fetchNotes({ subjectSlug: subject.slug });
    return { subject, notes };
  },
  head: ({ params, loaderData }) => {
    const subject = loaderData?.subject;
    const notes = loaderData?.notes ?? [];
    if (!subject) return { meta: [{ title: "Subject — NotesKhuji" }] };

    const title = `${subject.name} Notes — Lectures, PDFs & Past Papers | NotesKhuji`;
    const description = `Download the best ${subject.name} notes from top Bangladeshi universities like BUET, DU, NSU and BRACU. ${notes.length} verified PDFs, free previews, and instant access.`;
    const url = `${SITE_URL}/subjects/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: `${subject.name} notes, ${subject.name} PDF, Bangladesh university ${subject.name}, ${subject.name} lecture notes, ${subject.name} past papers` },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "NotesKhuji" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${subject.name} Notes`,
            description,
            url,
            inLanguage: "en",
            isPartOf: { "@type": "WebSite", name: "NotesKhuji", url: SITE_URL },
            about: { "@type": "Thing", name: subject.name },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Subjects", item: `${SITE_URL}/browse` },
                { "@type": "ListItem", position: 3, name: subject.name, item: url },
              ],
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: notes.length,
              itemListElement: notes.slice(0, 20).map((n, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}/notes/${n.id}`,
                name: n.title,
              })),
            },
          }),
        },
      ],
    };
  },
});

function SubjectPage() {
  const { subject, notes } = Route.useLoaderData();
  const totalDownloads = notes.reduce((sum: number, n: Note) => sum + (n.downloads ?? 0), 0);
  const universitiesWithNotes = Array.from(new Set(notes.map((n: Note) => n.university)));
  const freeCount = notes.filter((n: Note) => n.price === 0).length;

  return (
    <SiteShell>
      <section className={`relative overflow-hidden bg-gradient-to-br ${subject.color} text-white`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {subject.name} Notes
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            Download verified {subject.name} notes contributed by students from Bangladesh's top universities. From intro
            courses to advanced electives — all PDFs, free previews available.
          </p>
          <dl className="mt-6 grid max-w-md grid-cols-3 gap-4 text-white">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/70">Notes</dt>
              <dd className="font-display text-xl font-semibold sm:text-2xl">{notes.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/70">Free</dt>
              <dd className="font-display text-xl font-semibold sm:text-2xl">{freeCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/70">Downloads</dt>
              <dd className="font-display text-xl font-semibold sm:text-2xl">{totalDownloads.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold sm:text-2xl">All {subject.name} notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? "note" : "notes"} available
            </p>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No notes uploaded yet for {subject.name}. Be the first!</p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upload notes
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {notes.map((n: Note) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        )}

        {universitiesWithNotes.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Universities offering {subject.name}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {universities
                .filter((u) => universitiesWithNotes.includes(u.short))
                .map((u) => (
                  <Link
                    key={u.slug}
                    to="/universities/$slug"
                    params={{ slug: u.slug }}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold group-hover:text-primary">{u.short}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.name}</div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">About {subject.name} notes on NotesKhuji</h2>
          <div className="mt-3 grid gap-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <p>
              Every {subject.name} PDF on NotesKhuji is uploaded by verified students from leading Bangladeshi universities
              and reviewed before publishing. You can read a free 3-page preview of any premium note before purchasing.
            </p>
            <p>
              Looking to earn? Upload your own {subject.name} notes and start receiving payouts each time another student
              downloads them. Free notes can be downloaded instantly with a single click.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <DownloadIcon className="h-4 w-4 text-primary" /> {totalDownloads.toLocaleString()} total downloads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> {notes.length} curated PDFs
            </span>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
