import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATALOG } from "@/lib/catalog";

// In-memory cache (per Worker instance). Good enough for v1.
const textCache = new Map<number, string[]>();

function cleanGutenbergText(raw: string): string {
  // Strip Project Gutenberg header/footer
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

  // Normalize newlines
  text = text.replace(/\r\n/g, "\n").trim();
  return text;
}

function splitIntoChapters(text: string): string[] {
  // Try to split on common chapter markers
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
        if (body.length > 200) {
          chapters.push(`${heading}\n\n${body}`);
        }
      }
      if (chapters.length >= 3) return chapters;
    }
  }

  // Fallback: split into ~3000-word blocks
  const words = text.split(/\s+/);
  const blockSize = 3000;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += blockSize) {
    chunks.push(`Section ${Math.floor(i / blockSize) + 1}\n\n${words.slice(i, i + blockSize).join(" ")}`);
  }
  return chunks;
}

export const getBookChapters = createServerFn({ method: "GET" })
  .inputValidator(z.object({ bookId: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const book = CATALOG.find((b) => b.id === data.bookId);
    if (!book) return { chapters: [] as string[], error: "Book not found" };

    if (textCache.has(book.gutenbergId)) {
      return { chapters: textCache.get(book.gutenbergId)!, error: null };
    }

    const urls = [
      `https://www.gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}-0.txt`,
      `https://www.gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}.txt`,
      `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.txt`,
    ];

    let raw: string | null = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "LuminaBooks/1.0" } });
        if (res.ok) {
          raw = await res.text();
          break;
        }
      } catch (e) {
        console.error("gutenberg fetch failed", url, e);
      }
    }

    if (!raw) {
      return { chapters: [], error: "Could not fetch book from Project Gutenberg" };
    }

    const cleaned = cleanGutenbergText(raw);
    const chapters = splitIntoChapters(cleaned);
    textCache.set(book.gutenbergId, chapters);
    return { chapters, error: null };
  });

export const getChapterText = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const book = CATALOG.find((b) => b.id === data.bookId);
    if (!book) return { text: "", title: "", total: 0, error: "Book not found" };

    let chapters = textCache.get(book.gutenbergId);
    if (!chapters) {
      const result = await getBookChapters({ data: { bookId: data.bookId } });
      chapters = result.chapters;
      if (result.error) return { text: "", title: "", total: 0, error: result.error };
    }
    if (data.chapter >= chapters.length) {
      return { text: "", title: "", total: chapters.length, error: "Chapter out of range" };
    }
    const full = chapters[data.chapter];
    const firstNewline = full.indexOf("\n");
    const title = firstNewline > 0 ? full.slice(0, firstNewline).trim() : `Chapter ${data.chapter + 1}`;
    const text = firstNewline > 0 ? full.slice(firstNewline).trim() : full;
    return { text, title, total: chapters.length, error: null };
  });
