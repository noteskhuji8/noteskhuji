import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({ meta: [{ title: "Create account — NotesKhuji" }] }),
});

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", university: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: form.name, university: form.university },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to confirm your account.");
    navigate({ to: "/login" });
  };

  const handleGoogle = async () => {
    try {
      sessionStorage.setItem("post-auth-redirect", "/dashboard");
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
            <span className="font-display text-lg font-bold">Create your account</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Join 50,000+ Bangladeshi students learning smarter.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tanvir Ahmed" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu.bd" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="uni">University</Label>
              <Input id="uni" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="e.g. BUET, DU, NSU…" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="brand-gradient w-full text-white">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
