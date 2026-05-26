import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: UploadPage,
  head: () => ({ meta: [{ title: "Upload Notes — NotesKhuji" }] }),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    subject: "",
    university: "",
    description: "",
    tier: "Free",
    price: "0",
    pages: "0",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const premium = form.tier === "Premium";
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: form.title,
      subject: form.subject,
      subject_slug: slugify(form.subject),
      university: form.university,
      author: user.email ?? "Student",
      pages: parseInt(form.pages || "0", 10),
      price: premium ? parseInt(form.price || "0", 10) : 0,
      premium,
      preview: form.description,
      tags: [],
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Note submitted! It will appear once approved.");
    navigate({ to: "/dashboard" });
  };

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Earn from your notes</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Upload your notes</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Share your knowledge with thousands of students. Every upload is reviewed by our team
            within 24 hours before going live.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div>
              <Label>PDF file</Label>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-accent/30">
                <UploadCloud className="h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF up to 50MB</p>
                <input type="file" accept="application/pdf" className="hidden" />
              </label>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Data Structures — Complete Notes" className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Computer Science" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="uni">University</Label>
                <Input id="uni" required value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="BUET" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe what's inside…" className="mt-1.5 min-h-[110px]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pages">Pages</Label>
                <Input id="pages" type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tier">Pricing</Label>
                <select id="tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option>Free</option>
                  <option>Premium</option>
                </select>
              </div>
              <div>
                <Label htmlFor="price">Price (BDT)</Label>
                <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="149" className="mt-1.5" />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="brand-gradient w-full text-white">
              {saving ? "Submitting…" : "Submit for review"}
            </Button>
          </form>

          <aside className="space-y-5">
            <InfoCard icon={ShieldCheck} title="Quality first">
              Our team reviews every submission for clarity, accuracy and originality within 24 hours.
            </InfoCard>
            <InfoCard icon={Wallet} title="Earn 80% per sale">
              You keep 80% of every download. Cash out anytime via bKash, Nagad, or bank transfer.
            </InfoCard>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg brand-gradient text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
