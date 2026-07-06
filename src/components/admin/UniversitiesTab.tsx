import { useEffect, useState } from "react";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableRow } from "./SortableRow";

type University = {
  id: string; name: string; short: string; slug: string;
  city: string | null; logo: string | null; sort_order: number; active: boolean;
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function UniversitiesTab() {
  const [rows, setRows] = useState<University[] | null>(null);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("universities").select("*").order("sort_order", { ascending: true });
    if (error) return toast.error(error.message);
    setRows(data as University[]);
  };
  useEffect(() => { void load(); }, []);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!rows || !e.over || e.active.id === e.over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === e.active.id);
    const newIdx = rows.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(rows, oldIdx, newIdx).map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
    setRows(next);
    await Promise.all(next.map((r) =>
      (supabase as any).from("universities").update({ sort_order: r.sort_order }).eq("id", r.id),
    ));
  };

  const patch = (id: string, p: Partial<University>) =>
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null);

  const saveRow = async (r: University) => {
    setSaving(true);
    const { error } = await (supabase as any).from("universities").update({
      name: r.name, short: r.short, slug: r.slug || slugify(r.short),
      city: r.city, logo: r.logo, active: r.active,
    }).eq("id", r.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const addRow = async () => {
    const short = window.prompt("Short name (e.g. BUET)?"); if (!short) return;
    const name = window.prompt("Full name?") ?? short;
    const { data, error } = await (supabase as any).from("universities").insert({
      short, name, slug: slugify(short), sort_order: (rows?.length ?? 0) * 10 + 100,
    }).select().single();
    if (error) return toast.error(error.message);
    setRows((prev) => [...(prev ?? []), data as University]);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this university?")) return;
    const { error } = await (supabase as any).from("universities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  };

  if (!rows) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag to reorder. Click a field to edit.</p>
        <Button size="sm" onClick={addRow} className="gap-1"><Plus className="h-4 w-4" /> Add university</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {rows.map((r) => (
              <SortableRow key={r.id} id={r.id}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.4fr_1fr_1fr_auto]">
                  <Input value={r.short} onChange={(e) => patch(r.id, { short: e.target.value })} placeholder="Short" />
                  <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} placeholder="Full name" />
                  <Input value={r.slug} onChange={(e) => patch(r.id, { slug: e.target.value })} placeholder="slug" />
                  <Input value={r.city ?? ""} onChange={(e) => patch(r.id, { city: e.target.value })} placeholder="City" />
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => patch(r.id, { active: !r.active })}>
                      {r.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => saveRow(r)} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
