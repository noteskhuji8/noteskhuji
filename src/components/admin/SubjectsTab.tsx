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

type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function SubjectsTab() {
  const [rows, setRows] = useState<Subject[] | null>(null);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("subjects").select("*").order("sort_order", { ascending: true });
    if (error) return toast.error(error.message);
    setRows(data as Subject[]);
  };
  useEffect(() => { void load(); }, []);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!rows || !e.over || e.active.id === e.over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === e.active.id);
    const newIdx = rows.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(rows, oldIdx, newIdx).map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
    setRows(next);
    const updates = next.map((r) => (supabase as any).from("subjects").update({ sort_order: r.sort_order }).eq("id", r.id));
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Failed to save order");
  };

  const patch = (id: string, p: Partial<Subject>) =>
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null);

  const saveRow = async (r: Subject) => {
    setSaving(true);
    const { error } = await (supabase as any).from("subjects").update({
      name: r.name, slug: r.slug || slugify(r.name), description: r.description,
      icon: r.icon, active: r.active,
    }).eq("id", r.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const addRow = async () => {
    const name = window.prompt("Subject name?"); if (!name) return;
    const { data, error } = await (supabase as any).from("subjects").insert({
      name, slug: slugify(name), sort_order: (rows?.length ?? 0) * 10 + 100, icon: "BookOpen",
    }).select().single();
    if (error) return toast.error(error.message);
    setRows((prev) => [...(prev ?? []), data as Subject]);
    toast.success("Subject added");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    const { error } = await (supabase as any).from("subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  };

  if (!rows) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag to reorder. Click a field to edit.</p>
        <Button size="sm" onClick={addRow} className="gap-1"><Plus className="h-4 w-4" /> Add subject</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {rows.map((r) => (
              <SortableRow key={r.id} id={r.id}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} placeholder="Name" />
                  <Input value={r.slug} onChange={(e) => patch(r.id, { slug: e.target.value })} placeholder="slug" />
                  <Input value={r.icon ?? ""} onChange={(e) => patch(r.id, { icon: e.target.value })} placeholder="Icon (lucide name)" />
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => patch(r.id, { active: !r.active })} title={r.active ? "Active" : "Hidden"}>
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
