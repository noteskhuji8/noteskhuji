import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

/** Signed URL for any note's PDF — admin only. */
export const getAdminNoteFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: note, error } = await supabaseAdmin
      .from("notes")
      .select("file_path")
      .eq("id", data.noteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!note?.file_path) throw new Error("File not available");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("notes")
      .createSignedUrl(note.file_path, 60 * 10);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

/** Approve or reject a note — admin only. */
export const setNoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        noteId: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("notes")
      .update({ status: data.status, approved: data.status === "approved" })
      .eq("id", data.noteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
