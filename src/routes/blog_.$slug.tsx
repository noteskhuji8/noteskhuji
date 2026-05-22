import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { blogPosts } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog_/$slug")({
  component: BlogPost,
  loader: ({ params }) => {
    const post = blogPosts.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.title ?? "Article"} — NotesKhuji Blog` },
      { name: "description", content: loaderData?.post.excerpt ?? "" },
    ],
  }),
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <Badge variant="outline" className="mt-6">{post.category}</Badge>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
        <div className="mt-4 text-sm text-muted-foreground">{post.author} · {post.date} · {post.readTime} read</div>
        <div className={`mt-8 aspect-[16/8] rounded-2xl bg-gradient-to-br ${post.cover} shadow-lg`} />
        <div className="prose prose-lg mt-10 max-w-none text-foreground/90">
          <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          <h2 className="mt-10 font-display text-2xl font-bold">Why this matters</h2>
          <p className="mt-3 leading-relaxed">
            Every semester, thousands of students in Bangladesh struggle to find quality study material that
            actually matches their syllabus. At NotesKhuji, we believe great notes should be accessible,
            affordable, and trustworthy.
          </p>
          <h2 className="mt-8 font-display text-2xl font-bold">Putting it into practice</h2>
          <p className="mt-3 leading-relaxed">
            Start small: pick one subject, follow the steps in this guide for two weeks, and measure
            your progress. The compounding effect of small, consistent habits is what separates top
            students from the rest.
          </p>
          <p className="mt-3 leading-relaxed">
            Have a story or strategy you'd like to share? We're always looking for student writers.
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
