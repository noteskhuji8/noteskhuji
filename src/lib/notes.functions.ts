import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PDFDocument } from "pdf-lib";

const SIGNED_URL_TTL = 60 * 5; // 5 minutes
const PREVIEW_PAGES = 3;

async function getNoteRow(noteId: string) {
  const { data, error } = await supabaseAdmin
    .from("notes")
    .select("id, user_id, price, premium, file_path, status")
    .eq("id", noteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Returns a short-lived signed URL for the FULL PDF.
 *  Allowed when: user owns the note, has purchased it, or it is a free approved note. */
export const getNoteFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const note = await getNoteRow(data.noteId);
    if (!note || !note.file_path) throw new Error("Note file not available");

    const isOwner = note.user_id === userId;
    const isFree = !note.premium && note.price === 0 && note.status === "approved";
    let isPurchaser = false;
    if (!isOwner && !isFree) {
      const { data: p } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("note_id", note.id)
        .maybeSingle();
      isPurchaser = !!p;
    }
    if (!isOwner && !isFree && !isPurchaser) {
      throw new Error("Purchase required to view this note");
    }

    const { data: signed, error } = await supabaseAdmin.storage
      .from("notes")
      .createSignedUrl(note.file_path, SIGNED_URL_TTL);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

/** Returns a signed URL to a generated PREVIEW PDF (first N pages).
 *  Available to anyone for approved notes. Cached at `previews/<noteId>.pdf`. */
export const getNotePreviewUrl = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const note = await getNoteRow(data.noteId);
    if (!note || note.status !== "approved" || !note.file_path) {
      throw new Error("Preview not available");
    }
    const previewPath = `previews/${note.id}.pdf`;

    // If preview missing, generate it
    const head = await supabaseAdmin.storage.from("notes").list("previews", {
      search: `${note.id}.pdf`,
      limit: 1,
    });
    const exists = head.data?.some((f) => f.name === `${note.id}.pdf`);

    if (!exists) {
      const dl = await supabaseAdmin.storage.from("notes").download(note.file_path);
      if (dl.error || !dl.data) throw new Error(dl.error?.message ?? "Source file missing");
      const srcBytes = new Uint8Array(await dl.data.arrayBuffer());
      const src = await PDFDocument.load(srcBytes);
      const out = await PDFDocument.create();
      const pages = Math.min(PREVIEW_PAGES, src.getPageCount());
      const copied = await out.copyPages(src, Array.from({ length: pages }, (_, i) => i));
      copied.forEach((p) => out.addPage(p));
      const outBytes = await out.save();
      const up = await supabaseAdmin.storage.from("notes").upload(previewPath, outBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);
    }

    const { data: signed, error } = await supabaseAdmin.storage
      .from("notes")
      .createSignedUrl(previewPath, SIGNED_URL_TTL);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl, pages: PREVIEW_PAGES };
  });

/** Records a purchase for the current user. (No real payment integration yet.) */
export const purchaseNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const note = await getNoteRow(data.noteId);
    if (!note || note.status !== "approved") throw new Error("Note not available");
    const { error } = await supabaseAdmin
      .from("purchases")
      .insert({ user_id: userId, note_id: note.id, amount: note.price })
      .select()
      .single();
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

/** Returns a short-lived signed download URL and records the download.
 *  Allowed for: owner, purchaser, or free approved notes. */
export const downloadNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const note = await getNoteRow(data.noteId);
    if (!note || !note.file_path) throw new Error("Note file not available");
    if (note.status !== "approved") throw new Error("Note not available");

    const isOwner = note.user_id === userId;
    const isFree = !note.premium && note.price === 0;
    let isPurchaser = false;
    if (!isOwner && !isFree) {
      const { data: p } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("note_id", note.id)
        .maybeSingle();
      isPurchaser = !!p;
    }
    if (!isOwner && !isFree && !isPurchaser) {
      throw new Error("Purchase required to download this note");
    }

    const { data: signed, error } = await supabaseAdmin.storage
      .from("notes")
      .createSignedUrl(note.file_path, SIGNED_URL_TTL, { download: true });
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");

    const { data: newCount, error: rpcErr } = await supabaseAdmin.rpc(
      "record_note_download",
      { _note_id: note.id, _user_id: userId },
    );
    if (rpcErr) throw new Error(rpcErr.message);

    return { url: signed.signedUrl, downloads: newCount as number };
  });

/** Current user's download history (most recent first). */
export const getMyDownloads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("downloads")
      .select("id, downloaded_at, note_id, notes(id, title, subject, university, cover)")
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { downloads: data ?? [] };
  });

/** True if current user has access (owner / purchaser / free). */
export const checkNoteAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const note = await getNoteRow(data.noteId);
    if (!note) return { hasAccess: false, isOwner: false, isFree: false };
    const isOwner = note.user_id === userId;
    const isFree = !note.premium && note.price === 0;
    if (isOwner || isFree) return { hasAccess: true, isOwner, isFree };
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("note_id", note.id)
      .maybeSingle();
    return { hasAccess: !!p, isOwner, isFree };
  });
