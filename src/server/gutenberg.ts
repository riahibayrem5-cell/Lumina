import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";
import { CATALOG } from "@/lib/catalog";

// In-memory cache (per Worker instance). Keyed by gutenberg_id.
const textCache = new Map<string, string[]>();

type Db = SupabaseClient<Database>;

function cleanGutenbergText(raw: string): string {
  const startMatchers = [
    /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i,
    /\*\*\*START OF THE PROJECT GUTENBERG.*?\*\*\*/i,
  ];
  const endMatchers = [
    /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i,
    /End of (?:the )?Project Gutenberg/i,
  ];
  let text = raw;
  for (const m of startMatchers) {
    const match = text.match(m);
    if (match && match.index !== undefined) {
      text = text.slice(match.index + match[0].length);
      break;
    }
  }
  for (const m of endMatchers) {
    const match = text.match(m);
    if (match && match.index !== undefined) {
      text = text.slice(0, match.index);
      break;
    }
  }
  return text.replace(/\r\n/g, "\n").trim();
}

function splitIntoChapters(text: string): string[] {
  const patterns = [
    /\n\s*CHAPTER\s+[IVXLCDM\d]+[^\n]*\n/gi,
    /\n\s*Chapter\s+[IVXLCDM\d]+[^\n]*\n/g,
    /\n\s*LETTER\s+[IVXLCDM\d]+[^\n]*\n/gi,
    /\n\s*[IVXLCDM]{1,5}\.\s*\n/g,
  ];
  for (const p of patterns) {
    const matches = [...text.matchAll(p)];
    if (matches.length >= 3) {
      const chapters: string[] = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
        const heading = matches[i][0].trim();
        const body = text.slice(start + matches[i][0].length, end).trim();
        if (body.length > 200) chapters.push(`${heading}\n\n${body}`);
      }
      if (chapters.length >= 3) return chapters;
    }
  }
  const words = text.split(/\s+/);
  const blockSize = 3000;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += blockSize) {
    chunks.push(`Section ${Math.floor(i / blockSize) + 1}\n\n${words.slice(i, i + blockSize).join(" ")}`);
  }
  return chunks;
}

async function fetchGutenbergRaw(gutenbergId: string): Promise<string | null> {
  const urls = [
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}.txt`,
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "LuminaBooks/1.0" } });
      if (res.ok) return await res.text();
    } catch (e) {
      console.error("gutenberg fetch failed", url, e);
    }
  }
  return null;
}

// Bootstraps a curated catalog book into public.books if it isn't there yet.
// Uses the user-authenticated client; RLS allows any authenticated user to insert.
async function ensureCuratedBookRow(db: Db, slug: string): Promise<string | null> {
  const curated = CATALOG.find((c) => c.id === slug);
  if (!curated) return null;
  const cover = curated.coverIsbn
    ? `https://covers.openlibrary.org/b/isbn/${curated.coverIsbn}-L.jpg`
    : `https://covers.openlibrary.org/b/title/${encodeURIComponent(curated.title)}-L.jpg`;

  // RLS doesn't allow UPDATE on books, so do an insert-if-missing instead of upsert.
  const existing = await db.from("books").select("gutenberg_id").eq("slug", slug).maybeSingle();
  if (existing.data) return existing.data.gutenberg_id ?? String(curated.gutenbergId);

  const ins = await db
    .from("books")
    .insert({
      slug: curated.id,
      title: curated.title,
      author: curated.author,
      year: curated.year,
      era: curated.era,
      description: curated.hook,
      cover_url: cover,
      gutenberg_id: String(curated.gutenbergId),
      source: "gutenberg",
    })
    .select("gutenberg_id")
    .maybeSingle();

  if (ins.data) return ins.data.gutenberg_id ?? String(curated.gutenbergId);

  // Race: another request inserted it. Re-read.
  const retry = await db.from("books").select("gutenberg_id").eq("slug", slug).maybeSingle();
  return retry.data?.gutenberg_id ?? String(curated.gutenbergId);
}

async function loadChaptersForSlug(
  db: Db,
  slug: string,
): Promise<{ chapters: string[]; gutenbergId: string | null; error: string | null }> {
  let row = await db.from("books").select("gutenberg_id,total_chapters").eq("slug", slug).maybeSingle();
  if (row.error || !row.data) {
    const seededGid = await ensureCuratedBookRow(db, slug);
    if (!seededGid) {
      return { chapters: [], gutenbergId: null, error: "Book not found" };
    }
    row = await db.from("books").select("gutenberg_id,total_chapters").eq("slug", slug).maybeSingle();
    if (row.error || !row.data) {
      return { chapters: [], gutenbergId: null, error: "Book not found" };
    }
  }
  const gid = row.data.gutenberg_id;
  if (!gid) return { chapters: [], gutenbergId: null, error: "This book has no free full-text source available." };
  if (textCache.has(gid)) return { chapters: textCache.get(gid)!, gutenbergId: gid, error: null };
  const raw = await fetchGutenbergRaw(gid);
  if (!raw) return { chapters: [], gutenbergId: gid, error: "Could not fetch book from Project Gutenberg" };
  const chapters = splitIntoChapters(cleanGutenbergText(raw));
  textCache.set(gid, chapters);
  return { chapters, gutenbergId: gid, error: null };
}

export const getBookChapters = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const r = await loadChaptersForSlug(context.supabase as Db, data.slug);
    return { chapters: r.chapters, error: r.error };
  });

export const getChapterText = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const r = await loadChaptersForSlug(context.supabase as Db, data.slug);
    if (r.error) return { text: "", title: "", total: 0, error: r.error };
    if (data.chapter >= r.chapters.length) {
      return { text: "", title: "", total: r.chapters.length, error: "Chapter out of range" };
    }
    const full = r.chapters[data.chapter];
    const firstNewline = full.indexOf("\n");
    const title = firstNewline > 0 ? full.slice(0, firstNewline).trim() : `Chapter ${data.chapter + 1}`;
    const text = firstNewline > 0 ? full.slice(firstNewline).trim() : full;
    return { text, title, total: r.chapters.length, error: null };
  });

// Internal helper for ai.ts (already inside an authenticated request context).
export async function loadChaptersWithDb(db: Db, slug: string) {
  return loadChaptersForSlug(db, slug);
}
