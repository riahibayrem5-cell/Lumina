// Catalog refresh — pulls top public-domain titles from Project Gutenberg,
// resolves covers, and inserts any rows that are missing from public.books.
// Used by both the manual /library button and the daily pg_cron job.

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveCover } from "@/server/covers";

interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string; birth_year?: number | null; death_year?: number | null }>;
  subjects?: string[];
  bookshelves?: string[];
  languages?: string[];
  download_count?: number;
}

interface GutenbergPage {
  count: number;
  next: string | null;
  results: GutenbergBook[];
}

const GUTENDEX_TOP =
  "https://gutendex.com/books/?languages=en&sort=popular&copyright=false";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferEra(year: number | null): string | null {
  if (!year) return null;
  if (year < 1700) return "Renaissance";
  if (year < 1800) return "Enlightenment";
  if (year < 1837) return "Romantic";
  if (year < 1901) return "Victorian";
  if (year < 1914) return "Edwardian";
  if (year < 1945) return "Modernist";
  return "Modern";
}

function pickAuthorYear(b: GutenbergBook): number | null {
  const a = b.authors?.[0];
  if (!a) return null;
  // Estimate publication year from author lifespan midpoint
  if (a.birth_year && a.death_year) {
    return Math.round((a.birth_year + a.death_year) / 2);
  }
  return a.death_year ?? a.birth_year ?? null;
}

function shortAuthor(b: GutenbergBook): string {
  const a = b.authors?.[0]?.name ?? "Unknown";
  // Gutenberg gives "Last, First" — flip it.
  if (a.includes(",")) {
    const [last, first] = a.split(",").map((s) => s.trim());
    return `${first} ${last}`.trim();
  }
  return a;
}

async function fetchTopGutenberg(pages: number): Promise<GutenbergBook[]> {
  const out: GutenbergBook[] = [];
  let url: string | null = GUTENDEX_TOP;
  let page = 0;
  while (url && page < pages) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "LuminaBooks/1.0" } });
      if (!res.ok) break;
      const data = (await res.json()) as GutenbergPage;
      out.push(...(data.results ?? []));
      url = data.next;
      page++;
    } catch {
      break;
    }
  }
  return out;
}

export interface RefreshResult {
  ok: boolean;
  inserted: number;
  skipped: number;
  total: number;
  error: string | null;
}

/**
 * Core refresh logic — used by the server function (manual button) and the
 * /api/public/cron/refresh-catalog cron route.
 */
export async function runCatalogRefresh(opts: {
  pages?: number;
  maxInserts?: number;
}): Promise<RefreshResult> {
  const pages = opts.pages ?? 2; // 32 books/page on Gutendex
  const maxInserts = opts.maxInserts ?? 24;

  let inserted = 0;
  let skipped = 0;
  let total = 0;
  let error: string | null = null;

  try {
    const books = await fetchTopGutenberg(pages);
    total = books.length;

    // Pull every existing slug + gutenberg_id once so we can dedupe in memory.
    const existing = await supabaseAdmin
      .from("books")
      .select("slug,gutenberg_id");
    const existingSlugs = new Set((existing.data ?? []).map((b) => b.slug));
    const existingGids = new Set(
      (existing.data ?? [])
        .map((b) => b.gutenberg_id)
        .filter((g): g is string => !!g),
    );

    for (const b of books) {
      if (inserted >= maxInserts) break;
      if (!b.title || !b.authors?.length) continue;
      // Skip "various" / collections — they're noisy.
      if (/^various$/i.test(b.authors[0].name)) {
        skipped++;
        continue;
      }
      const author = shortAuthor(b);
      const slug = slugify(`${b.title}-${author}`).slice(0, 80) || `gutenberg-${b.id}`;
      const gid = String(b.id);
      if (existingSlugs.has(slug) || existingGids.has(gid)) {
        skipped++;
        continue;
      }

      const year = pickAuthorYear(b);
      const era = inferEra(year);
      const cover = await resolveCover({ title: b.title, author });

      const ins = await supabaseAdmin.from("books").insert({
        slug,
        title: b.title.slice(0, 200),
        author: author.slice(0, 200),
        year,
        era,
        description: (b.subjects ?? []).slice(0, 3).join(" · ").slice(0, 400) || null,
        cover_url: cover,
        gutenberg_id: gid,
        source: "gutenberg-auto",
        last_refreshed_at: new Date().toISOString(),
      });
      if (ins.error) {
        // Race or constraint violation — count as skipped, don't blow up the loop.
        skipped++;
      } else {
        inserted++;
        existingSlugs.add(slug);
        existingGids.add(gid);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown refresh error";
  }

  // Always log the run so /library can show "last updated"
  await supabaseAdmin.from("catalog_refresh_log").insert({
    source: "gutenberg-top",
    inserted_count: inserted,
    skipped_count: skipped,
    error_message: error,
  });

  return { ok: !error, inserted, skipped, total, error };
}

/** Manual refresh — called from the /library "Refresh catalog" button. */
export const refreshCatalog = createServerFn({ method: "POST" }).handler(async () => {
  const r = await runCatalogRefresh({ pages: 2, maxInserts: 16 });
  return r;
});

/** Lightweight read for the library page header. */
export const getCatalogStatus = createServerFn({ method: "GET" }).handler(async () => {
  const [latest, count] = await Promise.all([
    supabaseAdmin
      .from("catalog_refresh_log")
      .select("ran_at,inserted_count,skipped_count,error_message")
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("books").select("id", { count: "exact", head: true }),
  ]);
  return {
    lastRun: latest.data ?? null,
    totalBooks: count.count ?? 0,
    error: latest.error?.message ?? null,
  };
});
