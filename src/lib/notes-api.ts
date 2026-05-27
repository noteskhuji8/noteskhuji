import { supabase } from "@/integrations/supabase/client";
import type { Note } from "@/lib/mock-data";

export type DbNote = {
  id: string;
  title: string;
  subject: string;
  subject_slug: string;
  university: string;
  author: string;
  pages: number;
  downloads: number;
  rating: number;
  price: number;
  premium: boolean;
  cover: string;
  preview: string;
  tags: string[];
};

export function toNote(row: DbNote): Note {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    subjectSlug: row.subject_slug,
    university: row.university,
    author: row.author,
    pages: row.pages,
    downloads: row.downloads,
    rating: Number(row.rating),
    price: row.price,
    premium: row.premium,
    cover: row.cover,
    preview: row.preview,
    tags: row.tags ?? [],
  };
}

export type BrowseFilters = {
  q?: string;
  subjectSlug?: string | null;
  universityShort?: string | null;
  tier?: "all" | "free" | "premium";
};

export async function fetchNotes(filters: BrowseFilters = {}): Promise<Note[]> {
  let query = supabase
    .from("notes")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (filters.subjectSlug) query = query.eq("subject_slug", filters.subjectSlug);
  if (filters.universityShort) query = query.eq("university", filters.universityShort);
  if (filters.tier === "free") query = query.eq("price", 0);
  if (filters.tier === "premium") query = query.gt("price", 0);
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${term}%,subject.ilike.%${term}%,university.ilike.%${term}%,author.ilike.%${term}%`,
    );
  }

  const { data, error } = await query.limit(60);
  if (error) throw error;
  return (data as DbNote[]).map(toNote);
}

export async function fetchNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toNote(data as DbNote) : null;
}

export async function fetchMyNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbNote[]).map(toNote);
}
