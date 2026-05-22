import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog")({
  component: Blog,
  head: () => ({
    meta: [
      { title: "Blog — NotesKhuji" },
      { name: "description", content: "Study tips, exam prep guides and resources for Bangladeshi students." },
    ],
  }),
});

function Blog() {
  const [featured, ...rest] = blogPosts;
  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Blog</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Insights for better learning
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Study guides, exam strategies, and stories from students across Bangladesh.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/blog/$slug"
          params={{ slug: featured.slug }}
          className="group grid gap-6 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2"
        >
          <div className={`aspect-[16/10] bg-gradient-to-br ${featured.cover} md:aspect-auto`} />
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <Badge variant="outline" className="w-fit">{featured.category}</Badge>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight group-hover:text-primary sm:text-3xl">{featured.title}</h2>
            <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-5 text-xs text-muted-foreground">{featured.author} · {featured.date} · {featured.readTime} read</div>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">Read article <ArrowRight className="h-4 w-4" /></span>
          </div>
        </Link>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`aspect-[16/10] bg-gradient-to-br ${p.cover}`} />
              <div className="p-5">
                <Badge variant="outline">{p.category}</Badge>
                <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold group-hover:text-primary">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-4 text-xs text-muted-foreground">{p.date} · {p.readTime} read</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
