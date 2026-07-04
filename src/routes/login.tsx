import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/dashboard",
  }),
  component: Login,
  head: () => ({ meta: [{ title: "Log in — NotesKhuji" }] }),
});

function Login() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: redirect });
  };

  const handleGoogle = async () => {
    // OAuth redirect_uri must be a public same-origin URL (not a protected
    // route like /dashboard). We stash the intended destination in
    // sessionStorage and navigate to it after the session hydrates.
    try {
      sessionStorage.setItem("post-auth-redirect", redirect);
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2">
            <img src={logo} className="h-8 w-8 rounded-md" alt="" />
            <span className="font-display text-lg font-bold">Welcome back</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Log in to access your notes and dashboard.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu.bd" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="brand-gradient w-full text-white">
              {loading ? "Signing in…" : "Log in"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="font-medium text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
