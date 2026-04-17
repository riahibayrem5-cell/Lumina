import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth, sendSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUS = z.enum(["reading", "completed", "to-read", "paused"]);

export const getMyLibrary = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await supabaseAdmin
      .from("user_library")
      .select("*, book:books(*)")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (r.error) return { entries: [], error: r.error.message };
    return { entries: r.data ?? [], error: null };
  });

export const upsertProgress = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      bookId: z.string().uuid(),
      chapter: z.number().int().min(0).max(2000),
      scrollRatio: z.number().min(0).max(1),
      status: STATUS.optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const r = await supabaseAdmin
      .from("user_library")
      .upsert(
        {
          user_id: context.userId,
          book_id: data.bookId,
          current_chapter: data.chapter,
          scroll_ratio: data.scrollRatio,
          status: data.status ?? "reading",
        },
        { onConflict: "user_id,book_id" },
      )
      .select("*")
      .single();
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true, entry: r.data };
  });

export const setBookStatus = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ bookId: z.string().uuid(), status: STATUS }))
  .handler(async ({ data, context }) => {
    const r = await supabaseAdmin
      .from("user_library")
      .upsert(
        { user_id: context.userId, book_id: data.bookId, status: data.status },
        { onConflict: "user_id,book_id" },
      );
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true };
  });

export const removeFromLibrary = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ bookId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await supabaseAdmin
      .from("user_library")
      .delete()
      .eq("user_id", context.userId)
      .eq("book_id", data.bookId);
    return { ok: true };
  });

// === HIGHLIGHTS ===
export const addHighlight = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      bookId: z.string().uuid(),
      chapter: z.number().int().min(0).max(2000),
      text: z.string().min(2).max(2000),
      note: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const r = await supabaseAdmin
      .from("highlights")
      .insert({
        user_id: context.userId,
        book_id: data.bookId,
        chapter: data.chapter,
        text: data.text,
        note: data.note ?? null,
      })
      .select("*")
      .single();
    if (r.error) return { highlight: null, error: r.error.message };
    return { highlight: r.data, error: null };
  });

export const listHighlights = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ bookId: z.string().uuid().optional() }))
  .handler(async ({ data, context }) => {
    let q = supabaseAdmin
      .from("highlights")
      .select("*, book:books(slug,title,author)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.bookId) q = q.eq("book_id", data.bookId);
    const r = await q;
    if (r.error) return { highlights: [], error: r.error.message };
    return { highlights: r.data ?? [], error: null };
  });

export const removeHighlight = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await supabaseAdmin.from("highlights").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
