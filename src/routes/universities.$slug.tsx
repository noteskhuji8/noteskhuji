import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { NoteCard } from "@/components/notes/NoteCard";
import { subjects, universities, type Note } from "@/lib/mock-data";
import { fetchNotes } from "@/lib/notes-api";
import { ArrowLeft, BookOpen, Download as DownloadIcon, GraduationCap } from "lucide-react";

const SITE_URL = "https://noteskhuji-bd.lovable.app";

export const Route = createFileRoute("/universities/$slug")({
  component: UniversityPage,
  loader: async ({ params }) => {
    const university = universities.find((u) => u.slug === params.slug);
    if (!university) throw notFound();
    const notes = await fetchNotes({ universityShort: university.short });
    return { university, notes };
  },
  head: ({ params, loaderData }) => {
    const uni = loaderData?.university;
    const notes = loaderData?.notes ?? [];
    if (!uni) return { meta: [{ title: "University — NotesKhuji" }] };

    const title = `${uni.short} Notes — ${uni.name} Lecture Notes & PDFs | NotesKhuji`;
    const description = `Browse ${notes.length} verified ${uni.short} (${uni.name}) student notes. Free and premium PDF lecture notes, past papers and study guides — instant download on NotesKhuji.`;
    const url = `${SITE_URL}/universities/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: `${uni.short} notes, ${uni.name} notes, ${uni.short} PDF, ${uni.short} lecture notes, ${uni.short} past papers, Bangladesh university notes` },
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
          children: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${uni.short} Notes`,
              description,
              url,
              inLanguage: "en",
              isPartOf: { "@type": "WebSite", name: "NotesKhuji", url: SITE_URL },
              about: {
                "@type": "CollegeOrUniversity",
                name: uni.name,
                alternateName: uni.short,
                address: { "@type": "PostalAddress", addressCountry: "BD" },
              },
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Universities", item: `${SITE_URL}/browse` },
                  { "@type": "ListItem", position: 3, name: uni.short, item: url },
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
            },
            {
              "@context": "https://schema.org",
              "@type": "CollegeOrUniversity",
              name: uni.name,
              alternateName: uni.short,
              url,
              address: { "@type": "PostalAddress", addressCountry: "BD" },
            },
          ]),
        },
      ],
    };
  },
});

function UniversityPage() {
  const { university, notes } = Route.useLoaderData();
  const totalDownloads = notes.reduce((sum: number, n: Note) => sum + (n.downloads ?? 0), 0);
  const freeCount = notes.filter((n: Note) => n.price === 0).length;
  const subjectSlugsAvailable = Array.from(new Set(notes.map((n: Note) => n.subjectSlug)));

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur sm:flex">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-wide text-white/70">{university.short}</p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {university.name}
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            Verified student-uploaded PDF notes, lecture compilations and past papers from {university.name}. Read free
            previews before unlocking premium content.
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
            <h2 className="font-display text-xl font-semibold sm:text-2xl">All {university.short} notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? "note" : "notes"} available
            </p>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No notes uploaded yet for {university.short}. Be the first contributor!
            </p>
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

        {subjectSlugsAvailable.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Subjects at {university.short}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subjects
                .filter((s) => subjectSlugsAvailable.includes(s.slug))
                .map((s) => (
                  <Link
                    key={s.slug}
                    to="/subjects/$slug"
                    params={{ slug: s.slug }}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold group-hover:text-primary">{s.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.count.toLocaleString()} notes overall</div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">About {university.name} on NotesKhuji</h2>
          <div className="mt-3 grid gap-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <p>
              {university.name} ({university.short}) is one of Bangladesh's leading institutions. NotesKhuji hosts a growing
              library of {university.short} lecture notes, past papers and exam guides — every PDF reviewed before
              publishing.
            </p>
            <p>
              Studying at {university.short}? Upload your own notes to help your juniors and earn from every download.
              Free notes are downloadable instantly; premium notes include a free 3-page preview.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <DownloadIcon className="h-4 w-4 text-primary" /> {totalDownloads.toLocaleString()} total downloads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> {notes.length} verified PDFs
            </span>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
