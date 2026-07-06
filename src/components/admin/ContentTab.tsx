import { useEffect, useState } from "react";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ContentRow = { key: string; value: Record<string, unknown> };

const KNOWN_KEYS = ["hero", "cta_banner", "about"] as const;

export function ContentTab() {
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await (supabase as any).from("site_content").select("key, value");
    if (error) return toast.error(error.message);
    setRows(data as ContentRow[]);
  };
  useEffect(() => { void load(); }, []);

  const patch = (key: string, field: string, val: unknown) => {
    setRows((prev) => prev?.map((r) => r.key === key ? { ...r, value: { ...r.value, [field]: val } } : r) ?? null);
  };

  const save = async (row: ContentRow) => {
    setSaving(row.key);
    const { error } = await (supabase as any).from("site_content")
      .upsert({ key: row.key, value: row.value }, { onConflict: "key" });
    setSaving(null);
    if (error) toast.error(error.message); else toast.success(`${row.key} saved`);
  };

  const addBlock = async () => {
    const key = window.prompt("New content key (e.g. footer_note)?"); if (!key) return;
    const { error } = await (supabase as any).from("site_content").insert({ key, value: {} });
    if (error) return toast.error(error.message);
    await load();
  };

  if (!rows) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Edit copy shown on the homepage and other public pages. Changes save per block.</p>
        <Button size="sm" variant="outline" onClick={addBlock} className="gap-1"><Plus className="h-4 w-4" /> New block</Button>
      </div>

      {rows.map((row) => (
        <Card key={row.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base capitalize">{row.key.replace(/_/g, " ")}</CardTitle>
            <Button size="sm" onClick={() => save(row)} disabled={saving === row.key} className="gap-1">
              {saving === row.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(row.value).map(([field, val]) => {
              if (Array.isArray(val)) {
                return (
                  <div key={field}>
                    <label className="text-xs font-medium text-muted-foreground">{field} (comma separated)</label>
                    <Input
                      value={(val as string[]).join(", ")}
                      onChange={(e) => patch(row.key, field, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    />
                  </div>
                );
              }
              const isLong = typeof val === "string" && val.length > 80;
              return (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground">{field}</label>
                  {isLong ? (
                    <Textarea rows={3} value={String(val ?? "")} onChange={(e) => patch(row.key, field, e.target.value)} />
                  ) : (
                    <Input value={String(val ?? "")} onChange={(e) => patch(row.key, field, e.target.value)} />
                  )}
                </div>
              );
            })}
            {Object.keys(row.value).length === 0 && (
              <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Empty block — add fields via a new key/value pair below.
              </div>
            )}
            <AddField onAdd={(k, v) => patch(row.key, k, v)} />
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">
        Known blocks: {KNOWN_KEYS.join(", ")}. Homepage reads `hero` and `cta_banner`.
      </p>
    </div>
  );
}

function AddField({ onAdd }: { onAdd: (k: string, v: string) => void }) {
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2 border-t border-border pt-3">
      <Input placeholder="new field key" value={k} onChange={(e) => setK(e.target.value)} className="w-40" />
      <Input placeholder="value" value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => { if (k) { onAdd(k, v); setK(""); setV(""); } }}>Add</Button>
    </div>
  );
}
