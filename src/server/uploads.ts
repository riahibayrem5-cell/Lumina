import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";
import { cleanChapterTitle } from "@/lib/chapter-title";

// --- Chapter detection helpers (shared between PDF and EPUB) ---

const HEADING_PATTERNS: RegExp[] = [
  /\n\s*CHAPTER\s+[IVXLCDM\d]+[^\n]{0,80}\n/gi,
  /\n\s*Chapter\s+[IVXLCDM\d]+[^\n]{0,80}\n/g,
  /\n\s*PART\s+[IVXLCDM\d]+[^\n]{0,80}\n/gi,
  /\n\s*BOOK\s+[IVXLCDM\d]+[^\n]{0,80}\n/gi,
  /\n\s*[IVXLCDM]{1,5}\.\s*\n/g,
];

export interface DetectedChapter {
  title: string;
  text: string;
}

export function detectChapters(fullText: string): DetectedChapter[] {
  const text = fullText.replace(/\r\n/g, "\n").trim();
  for (const p of HEADING_PATTERNS) {
    const matches = [...text.matchAll(p)];
    if (matches.length >= 3) {
      const out: DetectedChapter[] = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
        const heading = matches[i][0].trim();
        const body = text.slice(start + matches[i][0].length, end).trim();
        if (body.length > 200) out.push({ title: heading, text: body });
      }
      if (out.length >= 3) return out;
    }
  }
  // Fallback: even chunks of ~3000 words
  const words = text.split(/\s+/);
  const blockSize = 3000;
  const chunks: DetectedChapter[] = [];
  for (let i = 0; i < words.length; i += blockSize) {
    const n = Math.floor(i / blockSize) + 1;
    chunks.push({
      title: `Section ${n}`,
      text: words.slice(i, i + blockSize).join(" "),
    });
  }
  return chunks.length > 0 ? chunks : [{ title: "Full text", text }];
}

// --- EPUB extraction (jszip + xml parsing) ---
// Note: PDF extraction happens in the browser (see src/lib/pdf-extract.ts).
// pdfjs-dist is not Worker-runtime compatible, so the client extracts text
// and sends it here for chapter detection.

async function extractEpubText(buf: ArrayBuffer): Promise<{
  text: string;
  title?: string;
  author?: string;
  spineChapters: DetectedChapter[];
}> {
  const JSZip = (await import("jszip")).default;
  const { XMLParser } = await import("fast-xml-parser");

  const zip = await JSZip.loadAsync(buf);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });

  // 1. Find OPF via container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");
  const container = parser.parse(containerXml);
  const rootfile = container?.container?.rootfiles?.rootfile;
  const opfPath = (Array.isArray(rootfile) ? rootfile[0] : rootfile)?.["@_full-path"];
  if (!opfPath) throw new Error("Invalid EPUB: no rootfile");

  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) throw new Error("Invalid EPUB: OPF missing");
  const opf = parser.parse(opfXml);

  // Metadata
  const meta = opf?.package?.metadata ?? {};
  const titleField = meta["dc:title"] ?? meta.title;
  const authorField = meta["dc:creator"] ?? meta.creator;
  const title =
    typeof titleField === "string"
      ? titleField
      : titleField?.["#text"] ?? (Array.isArray(titleField) ? titleField[0] : undefined);
  const author =
    typeof authorField === "string"
      ? authorField
      : authorField?.["#text"] ?? (Array.isArray(authorField) ? authorField[0] : undefined);

  // Manifest map: id -> href
  const manifestItemsRaw = opf?.package?.manifest?.item;
  const manifestItems = Array.isArray(manifestItemsRaw) ? manifestItemsRaw : [manifestItemsRaw].filter(Boolean);
  const idToHref = new Map<string, string>();
  for (const item of manifestItems) {
    if (item?.["@_id"] && item?.["@_href"]) {
      idToHref.set(item["@_id"], item["@_href"]);
    }
  }

  // Spine
  const spineItemsRaw = opf?.package?.spine?.itemref;
  const spineItems = Array.isArray(spineItemsRaw) ? spineItemsRaw : [spineItemsRaw].filter(Boolean);

  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const stripHtml = (html: string): string =>
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(?:p|div|h[1-6]|li|br)>/gi, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const extractTitleFromHtml = (html: string): string | null => {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) return stripHtml(h1[1]).slice(0, 100);
    const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2) return stripHtml(h2[1]).slice(0, 100);
    const titleEl = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleEl) return stripHtml(titleEl[1]).slice(0, 100);
    return null;
  };

  const spineChapters: DetectedChapter[] = [];
  let allText = "";
  let chIndex = 1;
  for (const itemref of spineItems) {
    const idref = itemref?.["@_idref"];
    const href = idref ? idToHref.get(idref) : null;
    if (!href) continue;
    const fullPath = opfDir + href;
    const html = await zip.file(fullPath)?.async("string");
    if (!html) continue;
    const detectedTitle = extractTitleFromHtml(html);
    const body = stripHtml(html);
    if (body.length < 100) continue;
    spineChapters.push({
      title: detectedTitle ?? `Chapter ${chIndex}`,
      text: body,
    });
    allText += body + "\n\n";
    chIndex++;
  }

  return { text: allText, title, author, spineChapters };
}

// --- Server functions ---

const UPLOAD_INPUT = z.object({
  filePath: z.string().min(1).max(400),
  format: z.enum(["pdf", "epub"]),
  fileName: z.string().min(1).max(300),
  fileSize: z.number().int().min(1).max(200 * 1024 * 1024),
  // For PDFs, the client extracts text and passes it here (pdfjs is browser-only).
  // EPUBs are parsed server-side via jszip.
  extractedText: z.string().max(8 * 1024 * 1024).optional(),
});

export const parseUploadedBook = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(UPLOAD_INPUT)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify path is within user's folder (defense in depth — RLS also enforces)
    if (!data.filePath.startsWith(`${userId}/`)) {
      return { ok: false, error: "Invalid file path", uploadId: null };
    }

    // Create initial DB row
    const baseTitle = data.fileName.replace(/\.(pdf|epub)$/i, "").trim() || "Untitled";
    const insert = await supabase
      .from("user_uploaded_books")
      .insert({
        user_id: userId,
        title: baseTitle,
        format: data.format,
        file_path: data.filePath,
        file_size_bytes: data.fileSize,
        status: "parsing",
      })
      .select("id")
      .single();

    if (insert.error || !insert.data) {
      return { ok: false, error: insert.error?.message ?? "Failed to record upload", uploadId: null };
    }
    const uploadId = insert.data.id;

    try {
      let chapters: DetectedChapter[] = [];
      let detectedTitle: string | undefined;
      let detectedAuthor: string | undefined;

      if (data.format === "pdf") {
        const text = (data.extractedText ?? "").trim();
        if (text.length < 200) {
          throw new Error(
            "PDF appears to be empty or image-only (no extractable text). Scanned PDFs aren't supported yet.",
          );
        }
        chapters = detectChapters(text);
      } else {
        // EPUB — fetch from storage and parse server-side
        const signed = await supabase.storage
          .from("user-books")
          .createSignedUrl(data.filePath, 60);
        if (signed.error || !signed.data?.signedUrl) {
          throw new Error(signed.error?.message ?? "Could not access file");
        }
        const fileRes = await fetch(signed.data.signedUrl);
        if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`);
        const buf = await fileRes.arrayBuffer();

        const epub = await extractEpubText(buf);
        detectedTitle = epub.title;
        detectedAuthor = epub.author;
        if (epub.spineChapters.length >= 2) {
          chapters = epub.spineChapters;
        } else {
          chapters = detectChapters(epub.text);
        }
      }

      // Normalize headings (Roman→Arabic, strip CHAPTER prefix dupes, title-case ALL CAPS)
      // and cap each chapter to a sensible size (preserves reading; AI calls slice further)
      const MAX_CH = 80000;
      chapters = chapters.map((c, i) => ({
        title: cleanChapterTitle(c.title, i).slice(0, 200),
        text: c.text.length > MAX_CH ? c.text.slice(0, MAX_CH) + "\n\n[…chapter truncated…]" : c.text,
      }));

      const finalTitle = detectedTitle?.trim() || baseTitle;

      const upd = await supabase
        .from("user_uploaded_books")
        .update({
          title: finalTitle,
          author: detectedAuthor?.trim() || null,
          status: "ready",
          total_chapters: chapters.length,
          chapters: chapters as never,
        })
        .eq("id", uploadId)
        .eq("user_id", userId);

      if (upd.error) throw new Error(upd.error.message);

      return { ok: true, uploadId, totalChapters: chapters.length, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse file";
      await supabase
        .from("user_uploaded_books")
        .update({ status: "error", error_message: msg })
        .eq("id", uploadId)
        .eq("user_id", userId);
      return { ok: false, error: msg, uploadId };
    }
  });

export const listMyUploads = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
      .from("user_uploaded_books")
      .select("id,title,author,format,status,total_chapters,error_message,created_at,file_size_bytes")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (r.error) return { uploads: [], error: r.error.message };
    return { uploads: r.data ?? [], error: null };
  });

export const getUploadDetail = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ uploadId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase
      .from("user_uploaded_books")
      .select("id,title,author,format,status,total_chapters,error_message,chapters,created_at")
      .eq("id", data.uploadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (r.error) return { upload: null, error: r.error.message };
    if (!r.data) return { upload: null, error: "Upload not found" };
    return { upload: r.data, error: null };
  });

export const updateUploadChapters = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      uploadId: z.string().uuid(),
      title: z.string().min(1).max(300).optional(),
      author: z.string().max(200).optional(),
      chapters: z
        .array(z.object({ title: z.string().min(1).max(200), text: z.string().min(10).max(120000) }))
        .min(1)
        .max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {
      chapters: data.chapters,
      total_chapters: data.chapters.length,
    };
    if (data.title) update.title = data.title;
    if (data.author !== undefined) update.author = data.author || null;

    const r = await context.supabase
      .from("user_uploaded_books")
      .update(update as never)
      .eq("id", data.uploadId)
      .eq("user_id", context.userId);
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true, error: null };
  });

export const deleteUpload = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ uploadId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Get file path so we can delete from storage too
    const row = await context.supabase
      .from("user_uploaded_books")
      .select("file_path")
      .eq("id", data.uploadId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (row.data?.file_path) {
      await context.supabase.storage.from("user-books").remove([row.data.file_path]);
    }
    await context.supabase
      .from("user_uploaded_books")
      .delete()
      .eq("id", data.uploadId)
      .eq("user_id", context.userId);
    return { ok: true };
  });
