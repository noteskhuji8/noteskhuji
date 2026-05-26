import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, BookOpen, Code2, Cpu, Sigma, Atom, FlaskConical, Briefcase,
  TrendingUp, Upload, ShieldCheck, Sparkles, Star, ArrowRight, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteShell } from "@/components/layout/SiteShell";
import { NoteCard } from "@/components/notes/NoteCard";
import { subjects, testimonials, universities, type Note } from "@/lib/mock-data";
import { fetchNotes } from "@/lib/notes-api";


export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "NotesKhuji — Bangladesh's Marketplace for Student Notes" },
      {
        name: "description",
        content:
          "Find, share and sell premium university notes from BUET, DU, NSU, BRACU and more. Trusted by 50,000+ Bangladeshi students.",
      },
    ],
  }),
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Cpu, Sigma, Atom, FlaskConical, Briefcase, TrendingUp, BookOpen,
};

function Home() {
  return (
    <SiteShell>
      <Hero />
      <PopularSubjects />
      <FeaturedNotes />
      <HowItWorks />
      <Universities />
      <Testimonials />
      <CTA />
    </SiteShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="brand-soft absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> 50,000+ students · 12,000+ notes
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find the perfect notes,{" "}
            <span className="brand-gradient-text">written by toppers.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            NotesKhuji is Bangladesh's home for premium university notes. Search by subject,
            preview before you buy, and learn from the best students in the country.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-primary/5">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes, subjects, universities…"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Link to="/browse">
              <Button className="brand-gradient text-white shadow-md">Search</Button>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Popular:</span>
            {["DSA", "Calculus", "Organic Chemistry", "DLD", "Microeconomics"].map((t) => (
              <Link key={t} to="/browse" className="rounded-full border border-border bg-background px-3 py-1 hover:border-primary hover:text-primary">
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-6 text-center sm:gap-10">
          {[
            { v: "12K+", l: "Notes" },
            { v: "50K+", l: "Students" },
            { v: "120+", l: "Universities" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-2xl font-bold text-foreground sm:text-3xl">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularSubjects() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Categories"
          title="Popular subjects"
          desc="Jump into the most-searched topics from universities across Bangladesh."
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {subjects.map((s) => {
            const Icon = iconMap[s.icon] ?? BookOpen;
            return (
              <Link
                key={s.slug}
                to="/subjects/$slug"
                params={{ slug: s.slug }}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{s.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.count.toLocaleString()} notes</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedNotes() {
  const [items, setItems] = useState<Note[]>([]);
  useEffect(() => {
    fetchNotes().then((n) => setItems(n.slice(0, 4))).catch(console.error);
  }, []);
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Trending"
            title="Featured notes"
            desc="Hand-picked from top contributors this week."
            align="left"
          />
          <Link to="/browse" className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex">
            View all <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </div>
    </section>
  );
}


function HowItWorks() {
  const steps = [
    { icon: Search, title: "Search & discover", desc: "Find notes by subject, course code or university in seconds." },
    { icon: ShieldCheck, title: "Preview & verify", desc: "Every note is admin-reviewed. See a free preview before you buy." },
    { icon: Upload, title: "Download or earn", desc: "Get instant PDF access — or upload your own and earn from each sale." },
  ];
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-muted/20 to-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How it works" title="Get started in three steps" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="absolute -top-3 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
                Step {i + 1}
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white shadow">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Universities() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Universities" title="Notes from across Bangladesh" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {universities.map((u) => (
            <div
              key={u.slug}
              className="flex h-20 items-center justify-center rounded-xl border border-border bg-card text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {u.short}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Loved by students" title="What our community says" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <Quote className="h-6 w-6 text-primary/60" />
              <p className="mt-4 text-sm leading-relaxed text-foreground">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full brand-gradient font-semibold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="brand-gradient relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-16 text-center text-white shadow-2xl shadow-primary/20 sm:px-12">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Got great notes? Turn them into income.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Upload your notes, set your price, and earn every time a student downloads.
            You keep 80% of every sale.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/upload">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Start uploading
              </Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/0 text-white hover:bg-white/10">
                Browse notes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow, title, desc, align = "center",
}: { eyebrow: string; title: string; desc?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {desc && <p className={`mt-3 text-muted-foreground ${align === "center" ? "mx-auto max-w-2xl" : ""}`}>{desc}</p>}
    </div>
  );
}
