import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";

const STATUS = z.enum(["reading", "completed", "to-read", "paused"]);

// === LIBRARY (progress) ===
export const getMyLibrary = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
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
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      scrollRatio: z.number().min(0).max(1),
      status: STATUS.optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    // Resolve book id from slug (RLS allows public read on books)
    const book = await context.supabase
      .from("books")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) return { ok: false, error: "Book not found" };

    const r = await context.supabase
      .from("user_library")
      .upsert(
        {
          user_id: context.userId,
          book_id: book.data.id,
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
  .inputValidator(z.object({ slug: z.string().min(1).max(120), status: STATUS }))
  .handler(async ({ data, context }) => {
    const book = await context.supabase
      .from("books")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) return { ok: false, error: "Book not found" };

    const r = await context.supabase
      .from("user_library")
      .upsert(
        { user_id: context.userId, book_id: book.data.id, status: data.status },
        { onConflict: "user_id,book_id" },
      );
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true };
  });

export const removeFromLibrary = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const book = await context.supabase
      .from("books")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!book.data) return { ok: true };
    await context.supabase
      .from("user_library")
      .delete()
      .eq("user_id", context.userId)
      .eq("book_id", book.data.id);
    return { ok: true };
  });

// === HIGHLIGHTS ===
export const addHighlight = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      text: z.string().min(2).max(2000),
      note: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const book = await context.supabase
      .from("books")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) return { highlight: null, error: "Book not found" };

    const r = await context.supabase
      .from("highlights")
      .insert({
        user_id: context.userId,
        book_id: book.data.id,
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
  .inputValidator(z.object({ slug: z.string().min(1).max(120).optional() }))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("highlights")
      .select("*, book:books(slug,title,author)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.slug) {
      const b = await context.supabase
        .from("books")
        .select("id")
        .eq("slug", data.slug)
        .maybeSingle();
      if (b.data) q = q.eq("book_id", b.data.id);
    }
    const r = await q;
    if (r.error) return { highlights: [], error: r.error.message };
    return { highlights: r.data ?? [], error: null };
  });

export const removeHighlight = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("highlights")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
