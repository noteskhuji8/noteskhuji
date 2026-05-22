import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — NotesKhuji" }] }),
});

function Contact() {
  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Get in touch</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">We'd love to hear from you</h1>
          <p className="mt-2 text-muted-foreground">Questions, feedback, partnerships — drop us a line.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <form className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" className="mt-1.5" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className="mt-1.5" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" className="mt-1.5" placeholder="How can we help?" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" className="mt-1.5 min-h-[140px]" placeholder="Tell us a bit more…" />
            </div>
            <Button type="button" className="brand-gradient w-full text-white">Send message</Button>
          </form>

          <aside className="space-y-4">
            <ContactItem icon={Mail} title="Email" value="hello@noteskhuji.com" />
            <ContactItem icon={MessageCircle} title="Support" value="Mon–Fri · 10am–7pm BST" />
            <ContactItem icon={MapPin} title="Office" value="Dhanmondi, Dhaka, Bangladesh" />
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function ContactItem({ icon: Icon, title, value }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg brand-gradient text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
