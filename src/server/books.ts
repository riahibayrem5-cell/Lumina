import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";
import { CATALOG } from "@/lib/catalog";

export interface BookRecord {
  id: string;
  slug: string;
  title: string;
  author: string;
  year: number | null;
  era: string | null;
  description: string | null;
  cover_url: string | null;
  gutenberg_id: string | null;
  open_library_id: string | null;
  source: "gutenberg" | "metadata_only" | "curated" | string;
  total_chapters: number | null;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  cover_edition_key?: string;
  ia?: string[];
  ebook_access?: string;
  has_fulltext?: boolean;
  ebook_count_i?: number;
  edition_key?: string[];
}

export interface SearchResult {
  slug: string;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
  open_library_id: string | null;
  gutenberg_id: string | null;
  source: "gutenberg" | "metadata_only" | "curated";
}

function slugify(title: string, author: string): string {
  return `${title}-${author}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function searchGutenberg(query: string): Promise<{ id: number; title: string; author: string } | null> {
  try {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}&languages=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }>;
    };
    const top = json.results?.[0];
    if (!top) return null;
    return {
      id: top.id,
      title: top.title,
      author: top.authors?.[0]?.name ?? "Unknown",
    };
  } catch {
    return null;
  }
}

// === SEARCH BOOKS ===
export const searchBooks = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const q = data.query.trim();
    if (!q) return { results: [] as SearchResult[], error: null };

    const results: SearchResult[] = [];

    // 1) Curated catalog matches first (instant, free Gutenberg text)
    const ql = q.toLowerCase();
    for (const c of CATALOG) {
      if (
        c.title.toLowerCase().includes(ql) ||
        c.author.toLowerCase().includes(ql) ||
        c.genre.some((g) => g.toLowerCase().includes(ql))
      ) {
        results.push({
          slug: c.id,
          title: c.title,
          author: c.author,
          year: c.year,
          cover_url: c.coverIsbn ? `https://covers.openlibrary.org/b/isbn/${c.coverIsbn}-L.jpg` : null,
          open_library_id: null,
          gutenberg_id: String(c.gutenbergId),
          source: "curated",
        });
      }
    }

    // 2) Open Library search for the long tail
    try {
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=15&fields=key,title,author_name,first_publish_year,cover_i,cover_edition_key,ia,ebook_access,has_fulltext`,
      );
      if (olRes.ok) {
        const olJson = (await olRes.json()) as { docs?: OpenLibraryDoc[] };
        for (const doc of olJson.docs ?? []) {
          if (!doc.title || !doc.author_name?.[0]) continue;
          const slug = slugify(doc.title, doc.author_name[0]);
          if (results.some((r) => r.slug === slug)) continue;
          results.push({
            slug,
            title: doc.title,
            author: doc.author_name[0],
            year: doc.first_publish_year ?? null,
            cover_url: doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              : doc.cover_edition_key
                ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`
                : null,
            open_library_id: doc.key,
            gutenberg_id: null,
            source: "metadata_only",
          });
          if (results.length >= 20) break;
        }
      }
    } catch (e) {
      console.error("openlibrary search failed", e);
    }

    return { results: results.slice(0, 20), error: null };
  });

// === GET OR CREATE BOOK ===
// Idempotently resolves a book by slug. If new, looks up Gutenberg + Open Library
// metadata and inserts a row into public.books, then returns it.
export const getOrCreateBook = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      // Optional hints from search results
      title: z.string().max(400).optional(),
      author: z.string().max(200).optional(),
      year: z.number().int().nullable().optional(),
      cover_url: z.string().url().nullable().optional(),
      open_library_id: z.string().max(100).nullable().optional(),
      gutenberg_id: z.string().max(20).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    // Use the authenticated user's client so RLS allows the books INSERT
    // (the policy requires role = 'authenticated').
    const db = context.supabase;

    const existing = await db
      .from("books")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing.data) {
      return { book: existing.data as unknown as BookRecord, error: null };
    }

    // Bootstrap from curated catalog if it matches
    const curated = CATALOG.find((c) => c.id === data.slug);
    let title = data.title ?? curated?.title;
    let author = data.author ?? curated?.author;
    let year = data.year ?? curated?.year ?? null;
    let cover = data.cover_url ?? null;
    let gutenbergId = data.gutenberg_id ?? (curated ? String(curated.gutenbergId) : null);
    const era = curated?.era ?? null;
    const description = curated?.hook ?? null;

    if (!title || !author) {
      return { book: null, error: "Missing title/author" };
    }

    if (!cover && curated?.coverIsbn) {
      cover = `https://covers.openlibrary.org/b/isbn/${curated.coverIsbn}-L.jpg`;
    }

    // If we don't have a Gutenberg ID yet, try Gutendex
    if (!gutenbergId) {
      const gut = await searchGutenberg(`${title} ${author}`);
      if (gut) {
        if (gut.author.toLowerCase().includes(author.split(" ").slice(-1)[0].toLowerCase())) {
          gutenbergId = String(gut.id);
        }
      }
    }

    const source: BookRecord["source"] = gutenbergId ? "gutenberg" : "metadata_only";

    const inserted = await db
      .from("books")
      .insert({
        slug: data.slug,
        title,
        author,
        year,
        era,
        description,
        cover_url: cover,
        gutenberg_id: gutenbergId,
        open_library_id: data.open_library_id ?? null,
        source,
      })
      .select("*")
      .single();

    if (inserted.error) {
      // Race: another request created it
      const retry = await db.from("books").select("*").eq("slug", data.slug).maybeSingle();
      if (retry.data) return { book: retry.data as unknown as BookRecord, error: null };
      return { book: null, error: inserted.error.message };
    }

    return { book: inserted.data as unknown as BookRecord, error: null };
  });

export const getBookBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const r = await supabaseAdmin.from("books").select("*").eq("slug", data.slug).maybeSingle();
    if (r.error) return { book: null, error: r.error.message };
    return { book: (r.data as unknown as BookRecord) ?? null, error: null };
  });

export const updateBookChapterCount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120), totalChapters: z.number().int().min(1).max(2000) }))
  .handler(async ({ data }) => {
    await supabaseAdmin
      .from("books")
      .update({ total_chapters: data.totalChapters })
      .eq("slug", data.slug);
    return { ok: true };
  });
