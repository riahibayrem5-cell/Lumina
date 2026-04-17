import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// In-memory cache (per Worker instance). Keyed by gutenberg_id.
const textCache = new Map<string, string[]>();

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

async function loadChaptersForSlug(slug: string): Promise<{ chapters: string[]; gutenbergId: string | null; error: string | null }> {
  const r = await supabaseAdmin.from("books").select("gutenberg_id,total_chapters").eq("slug", slug).maybeSingle();
  if (r.error || !r.data) return { chapters: [], gutenbergId: null, error: "Book not found" };
  const gid = r.data.gutenberg_id;
  if (!gid) return { chapters: [], gutenbergId: null, error: "This book has no free full-text source available." };
  if (textCache.has(gid)) return { chapters: textCache.get(gid)!, gutenbergId: gid, error: null };
  const raw = await fetchGutenbergRaw(gid);
  if (!raw) return { chapters: [], gutenbergId: gid, error: "Could not fetch book from Project Gutenberg" };
  const chapters = splitIntoChapters(cleanGutenbergText(raw));
  textCache.set(gid, chapters);
  // persist chapter count
  await supabaseAdmin.from("books").update({ total_chapters: chapters.length }).eq("slug", slug);
  return { chapters, gutenbergId: gid, error: null };
}

export const getBookChapters = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const r = await loadChaptersForSlug(data.slug);
    return { chapters: r.chapters, error: r.error };
  });

export const getChapterText = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const r = await loadChaptersForSlug(data.slug);
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
