import { useEffect, useState } from "react";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Star, StarOff, Loader2, Save, Filter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SortableRow } from "./SortableRow";

type NoteRow = {
  id: string; title: string; subject: string; university: string;
  price: number; premium: boolean; featured: boolean; sort_order: number; status: string;
};

export function NotesEditorTab() {
  const [rows, setRows] = useState<NoteRow[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = async () => {
    let q = (supabase as any).from("notes")
      .select("id, title, subject, university, price, premium, featured, sort_order, status")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    if (onlyFeatured) q = q.eq("featured", true);
    const { data, error } = await q;
    if (error) return toast.error(error.message);
    setRows(data as NoteRow[]);
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [onlyFeatured]);

  const patch = (id: string, p: Partial<NoteRow>) =>
    setRows((prev) => prev?.map((r) => r.id === id ? { ...r, ...p } : r) ?? null);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!rows || !e.over || e.active.id === e.over.id) return;
    const featured = rows.filter((r) => r.featured);
    const oldIdx = featured.findIndex((r) => r.id === e.active.id);
    const newIdx = featured.findIndex((r) => r.id === e.over!.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const nextFeatured = arrayMove(featured, oldIdx, newIdx).map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
    const nextAll = rows.map((r) => nextFeatured.find((n) => n.id === r.id) ?? r)
      .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order);
    setRows(nextAll);
    await Promise.all(nextFeatured.map((r) =>
      (supabase as any).from("notes").update({ sort_order: r.sort_order }).eq("id", r.id),
    ));
  };

  const save = async (r: NoteRow) => {
    setSaving(r.id);
    const { error } = await (supabase as any).from("notes").update({
      title: r.title, price: r.price, premium: r.premium, featured: r.featured,
    }).eq("id", r.id);
    setSaving(null);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const toggleFeatured = async (r: NoteRow) => {
    const next = !r.featured;
    patch(r.id, { featured: next });
    const { error } = await (supabase as any).from("notes").update({ featured: next }).eq("id", r.id);
    if (error) toast.error(error.message);
  };

  if (!rows) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Edit title, price, premium flag. Star a note to feature it — drag featured notes to reorder them on the homepage.
        </p>
        <Button size="sm" variant={onlyFeatured ? "default" : "outline"} onClick={() => setOnlyFeatured((v) => !v)} className="gap-1">
          <Filter className="h-3.5 w-3.5" /> {onlyFeatured ? "Featured only" : "Show all"}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={rows.filter((r) => r.featured).map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rows.map((r) => (
              <SortableRow key={r.id} id={r.id}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr_120px_auto]">
                  <div className="min-w-0">
                    <Input value={r.title} onChange={(e) => patch(r.id, { title: e.target.value })} />
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{r.subject}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.university}</Badge>
                      {r.featured && <Badge className="text-[10px]">featured</Badge>}
                    </div>
                  </div>
                  <div />
                  <div />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number" min={0} value={r.price}
                      onChange={(e) => patch(r.id, { price: Number(e.target.value) || 0, premium: Number(e.target.value) > 0 })}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">৳</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleFeatured(r)} title="Toggle featured">
                      {r.featured
                        ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                        : <StarOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => save(r)} disabled={saving === r.id}>
                      {saving === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
