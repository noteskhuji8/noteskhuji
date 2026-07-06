import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminSupabase as supabase } from "@/lib/admin-supabase";
import { ModerationTab } from "@/components/admin/ModerationTab";
import { AnalyticsTab, useAnalyticsData } from "@/components/admin/AnalyticsTab";
import { PayoutsTab } from "@/components/admin/PayoutsTab";
import { TransactionsTab } from "@/components/admin/TransactionsTab";
import { SubjectsTab } from "@/components/admin/SubjectsTab";
import { UniversitiesTab } from "@/components/admin/UniversitiesTab";
import { ContentTab } from "@/components/admin/ContentTab";
import { NotesEditorTab } from "@/components/admin/NotesEditorTab";

// ssr: false — inherits the same SSR/localStorage constraint as the parent
// _authenticated layout. The admin check has to run in the browser where the
// session exists.
export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Dashboard — NotesKhuji" }] }),
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (error || !userId) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    // Use the has_role security-definer function so this works even if the
    // user_roles SELECT policy doesn't grant the caller visibility on their
    // own row for other reasons.
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError) throw roleError;
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const analytics = useAnalyticsData();

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            <ShieldCheck className="mr-1 h-3 w-3" /> Admin
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Admin control center
          </h1>
          <p className="mt-1 text-muted-foreground">
            Moderate submissions, track revenue, and manage author payouts.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="notes">Notes &amp; Featured</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="universities">Universities</TabsTrigger>
            <TabsTrigger value="content">Site content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payouts">Sales &amp; Payouts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation"><ModerationTab /></TabsContent>
          <TabsContent value="notes"><NotesEditorTab /></TabsContent>
          <TabsContent value="subjects"><SubjectsTab /></TabsContent>
          <TabsContent value="universities"><UniversitiesTab /></TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab data={analytics.data} loading={analytics.loading} />
          </TabsContent>
          <TabsContent value="payouts"><PayoutsTab /></TabsContent>
          <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        </Tabs>
      </section>
    </SiteShell>
  );
}
