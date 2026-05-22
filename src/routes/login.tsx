import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Log in — NotesKhuji" }] }),
});

function Login() {
  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2">
            <img src={logo} className="h-8 w-8 rounded-md" alt="" />
            <span className="font-display text-lg font-bold">Welcome back</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Log in to access your notes and dashboard.</p>

          <form className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.edu.bd" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button type="button" className="brand-gradient w-full text-white">Log in</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full">Continue with Google</Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="font-medium text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
