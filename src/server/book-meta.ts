import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";

// Returns lightweight metadata for any book the reader can open.
// For curated books we look up by slug; for uploads (slug starts with "upload-") we look up the upload row.
export const getBookHeaderInfo = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    if (data.slug.startsWith("upload-")) {
      const id = data.slug.slice("upload-".length);
      const r = await context.supabase
        .from("user_uploaded_books")
        .select("title,author,total_chapters")
        .eq("id", id)
        .maybeSingle();
      if (r.error || !r.data) return { book: null, error: "Upload not found" };
      return {
        book: {
          id: data.slug,
          title: r.data.title,
          author: r.data.author ?? "Personal upload",
          totalChapters: r.data.total_chapters ?? 0,
          isUpload: true,
        },
        error: null,
      };
    }
    const r = await context.supabase
      .from("books")
      .select("slug,title,author,total_chapters")
      .eq("slug", data.slug)
      .maybeSingle();
    if (r.error || !r.data) return { book: null, error: "Book not found" };
    return {
      book: {
        id: r.data.slug,
        title: r.data.title,
        author: r.data.author,
        totalChapters: r.data.total_chapters ?? 0,
        isUpload: false,
      },
      error: null,
    };
  });
