import { createFileRoute, redirect } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteCard } from "@/components/notes/NoteCard";
import { notes } from "@/lib/mock-data";
import { Upload, Wallet, FileText, Download, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  // 1. ROUTE GUARD: Checks auth before the page even tries to load
  beforeLoad: async () => {
    // TODO: Replace with your real auth check (e.g., supabase.auth.getSession())
    // Set this to false right now to test your redirect in an incognito window!
    const isAuthenticated = true; 

    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },

  // 2. DATA LOADER: Fetches the user's actual data
  loader: async () => {
    // TODO: Replace with real database fetch for the logged-in user
    // e.g., const { data } = await supabase.from('profiles').select('*').single()
    
    // Returning dummy structure so the UI has variables to map to
    return {
      user: {
        name: "Student", // Will be fetched from DB
        role: "Student"
      },
      userStats: {
        uploads: 0,
        downloads: 0,
        earnings: 0,
        rating: 0.0,
      }
    };
  },

  head: () => ({ meta: [{ title: "Dashboard — NotesKhuji" }] }),
  component: Dashboard,
});

function Dashboard() {
  // 3. CONSUME DATA: Pull the verified data from the loader
  const { user, userStats } = Route.useLoaderData();

  // 4. MAP STATS DYNAMICALLY: Use the fetched data instead of hardcoded strings
  const displayStats = [
    { label: "Notes uploaded", value: userStats.uploads.toString(), icon: FileText },
    { label: "Total downloads", value: userStats.downloads.toLocaleString(), icon: Download },
    { label: "Earnings (BDT)", value: `৳ ${userStats.earnings.toLocaleString()}`, icon: Wallet },
    { label: "Avg. rating", value: userStats.rating.toFixed(1), icon: TrendingUp },
  ];

  // Keeping mock notes for the UI tabs until your notes database table is connected
  const my = notes.slice(0, 4);
  const purchased = notes.slice(4, 7);

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                {user.role}
              </Badge>
              {/* Dynamic Name */}
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
                Welcome back, {user.name} 👋
              </h1>
              <p className="mt-1 text-muted-foreground">Here's a snapshot of your NotesKhuji activity.</p>
            </div>
            <Link to="/upload">
              <Button className="brand-gradient gap-2 text-white">
                <Upload className="h-4 w-4" /> Upload new note
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Dynamic Stats Rendering */}
          {displayStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="uploaded" className="mt-10">
          <TabsList>
            <TabsTrigger value="uploaded">My uploads</TabsTrigger>
            <TabsTrigger value="purchased">Purchased</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          <TabsContent value="uploaded" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {my.map((n) => <NoteCard key={n.id} note={n} />)}
            </div>
          </TabsContent>
          <TabsContent value="purchased" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {purchased.map((n) => <NoteCard key={n.id} note={n} />)}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="mt-6">
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              You haven't saved any notes yet.
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteShell>
  );
}
