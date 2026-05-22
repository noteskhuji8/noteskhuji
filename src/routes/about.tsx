import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — NotesKhuji" },
      { name: "description", content: "NotesKhuji is on a mission to make quality study notes accessible to every student in Bangladesh." },
    ],
  }),
});

const values = [
  { icon: Heart, title: "Student-first", desc: "Built by students, for students. Every decision starts with you." },
  { icon: Target, title: "Quality over quantity", desc: "Every note is reviewed before it goes live." },
  { icon: Users, title: "Community-powered", desc: "Earn by teaching. Learn by sharing. We grow together." },
  { icon: Sparkles, title: "Accessible & affordable", desc: "Free notes for everyone. Premium when you want the best." },
];

function About() {
  return (
    <SiteShell>
      <section className="brand-soft border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Our story</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Making study notes <span className="brand-gradient-text">accessible to every student</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            NotesKhuji started in a Dhaka university dorm room with a simple question — why is it
            so hard to find good notes? Today, we're Bangladesh's largest student-driven notes
            marketplace, used by 50,000+ learners.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg brand-gradient text-white">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold">Join the community</h2>
          <p className="mt-3 text-muted-foreground">Sign up free and start exploring 12,000+ notes today.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg" className="brand-gradient text-white">Create an account</Button></Link>
            <Link to="/browse"><Button size="lg" variant="outline">Browse notes</Button></Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
