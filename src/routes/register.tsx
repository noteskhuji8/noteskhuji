import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create account — NotesKhuji" }] }),
});

function Register() {
  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2">
            <img src={logo} className="h-8 w-8 rounded-md" alt="" />
            <span className="font-display text-lg font-bold">Create your account</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Join 50,000+ Bangladeshi students learning smarter.</p>

          <form className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Tanvir Ahmed" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.edu.bd" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="uni">University</Label>
              <Input id="uni" placeholder="e.g. BUET, DU, NSU…" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" className="mt-1.5" />
            </div>
            <Button type="button" className="brand-gradient w-full text-white">Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
