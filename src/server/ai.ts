import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChapterText } from "./gutenberg";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

function chapterContext(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  const slice = Math.floor(maxChars / 3);
  return (
    text.slice(0, slice) +
    "\n\n[…middle of chapter…]\n\n" +
    text.slice(text.length / 2 - slice / 2, text.length / 2 + slice / 2) +
    "\n\n[…closing…]\n\n" +
    text.slice(-slice)
  );
}

async function callAI(body: Record<string, unknown>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Please pause a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable workspace settings.");
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function getBookBySlug(slug: string) {
  const r = await supabaseAdmin.from("books").select("*").eq("slug", slug).maybeSingle();
  return r.data;
}

interface CacheKey {
  userId: string;
  bookId: string;
  chapter: number;
  kind: string;
  style?: string;
}

async function readCache({ userId, bookId, chapter, kind, style = "" }: CacheKey) {
  const r = await supabaseAdmin
    .from("ai_cache")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .eq("kind", kind)
    .eq("style", style)
    .maybeSingle();
  return r.data;
}

async function writeCache(
  key: CacheKey,
  payload: Record<string, unknown>,
  imageUrl: string | null = null,
) {
  await supabaseAdmin.from("ai_cache").upsert(
    {
      user_id: key.userId,
      book_id: key.bookId,
      chapter: key.chapter,
      kind: key.kind,
      style: key.style ?? "",
      payload,
      image_url: imageUrl,
    } as never,
    { onConflict: "user_id,book_id,chapter,kind,style" },
  );
}

// === SUMMARY ===
export const generateChapterSummary = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { content: "", error: "Book not found" };

    const cacheKey = { userId: context.userId, bookId: book.id, chapter: data.chapter, kind: "summary" };
    if (!data.force) {
      const cached = await readCache(cacheKey);
      if (cached?.payload && typeof (cached.payload as { content?: string }).content === "string") {
        return { content: (cached.payload as { content: string }).content, error: null, cached: true };
      }
    }

    const ch = await getChapterText({ data: { slug: data.slug, chapter: data.chapter } });
    if (ch.error || !ch.text) return { content: "", error: ch.error ?? "No text" };

    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a literary scholar with the warmth of a beloved professor. Write in clear, beautiful prose. Use markdown headings.",
          },
          {
            role: "user",
            content: `Write a long-form scholarly analysis of this chapter from "${book.title}" by ${book.author}${book.year ? ` (${book.year})` : ""}.

Use these section headings exactly:
## Narrative Summary
## Character Arcs
## Thematic Exploration
## Historical & Cultural Context
## Literary Devices & Style
## Discussion Questions

Aim for richness and specificity. 1500–2500 words.

Chapter title: ${ch.title}

Chapter text:
${chapterContext(ch.text)}`,
          },
        ],
      });
      const content = result.choices?.[0]?.message?.content ?? "";
      if (content) await writeCache(cacheKey, { content });
      return { content, error: null };
    } catch (e) {
      return { content: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === MENTOR ===
export const generateMentorGuide = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { content: "", error: "Book not found" };

    const cacheKey = { userId: context.userId, bookId: book.id, chapter: data.chapter, kind: "mentor" };
    if (!data.force) {
      const cached = await readCache(cacheKey);
      if (cached?.payload && typeof (cached.payload as { content?: string }).content === "string") {
        return { content: (cached.payload as { content: string }).content, error: null, cached: true };
      }
    }

    const ch = await getChapterText({ data: { slug: data.slug, chapter: data.chapter } });
    // Mentor can work even if chapter text is unavailable (metadata-only books)
    const ctxStr = ch.error
      ? `(Full text unavailable; reason: ${ch.error}. Write from general knowledge of the book.)`
      : chapterContext(ch.text, 6000);

    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a kind, erudite mentor preparing a reader to enter a chapter. Be warm and concrete. Use markdown.",
          },
          {
            role: "user",
            content: `Prepare the reader for ${ch.title ? `"${ch.title}" of ` : ""}"${book.title}" by ${book.author}.

Use these sections:
## What to Expect (no spoilers beyond chapter end)
## Historical Background
## Symbolism to Watch For
## Vocabulary & References (5–8 terms with brief glosses)
## A Reading Strategy

Be specific. 600–900 words total.

Chapter excerpt or context:
${ctxStr}`,
          },
        ],
      });
      const content = result.choices?.[0]?.message?.content ?? "";
      if (content) await writeCache(cacheKey, { content });
      return { content, error: null };
    } catch (e) {
      return { content: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === ASK THE BOOK ===
export const askTheBook = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      tone: z.enum(["scholarly", "casual", "socratic"]).default("scholarly"),
      messages: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          }),
        )
        .min(1)
        .max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { reply: "", error: "Book not found" };
    const ch = await getChapterText({ data: { slug: data.slug, chapter: data.chapter } });

    const toneMap: Record<"scholarly" | "casual" | "socratic", string> = {
      scholarly: "Respond with the precision of a literary critic. Cite specific lines when relevant.",
      casual: "Respond like a thoughtful friend who loves this book. Warm, plainspoken.",
      socratic: "Respond by asking the reader sharper questions back. Help them discover.",
    };
    const toneInstr = toneMap[data.tone as keyof typeof toneMap];

    const groundingMsg = ch.error
      ? `(Full text unavailable. Answer from general knowledge of "${book.title}" by ${book.author}.)`
      : `Chapter text for grounding:\n${chapterContext(ch.text, 8000)}`;

    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an AI companion grounded in "${book.title}" by ${book.author}${ch.title ? `, currently scoped to chapter "${ch.title}"` : ""}. ${toneInstr} If a question requires events past this chapter, gently say so. Keep replies under 350 words.`,
          },
          { role: "system", content: groundingMsg },
          ...data.messages,
        ],
      });
      const reply = result.choices?.[0]?.message?.content ?? "";

      // Persist last user message + assistant reply to chat_messages
      const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
      if (lastUser) {
        await supabaseAdmin.from("chat_messages").insert([
          { user_id: context.userId, book_id: book.id, chapter: data.chapter, role: "user", content: lastUser.content },
          { user_id: context.userId, book_id: book.id, chapter: data.chapter, role: "assistant", content: reply },
        ]);
      }
      return { reply, error: null };
    } catch (e) {
      return { reply: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

export const getChatHistory = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().min(1).max(120), chapter: z.number().int().min(0).max(2000) }))
  .handler(async ({ data, context }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { messages: [] as { role: "user" | "assistant"; content: string }[], error: null };
    const r = await supabaseAdmin
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("user_id", context.userId)
      .eq("book_id", book.id)
      .eq("chapter", data.chapter)
      .order("created_at", { ascending: true })
      .limit(40);
    const messages = (r.data ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }));
    return { messages, error: null };
  });

// === HIGHLIGHT MICRO-ANALYSIS ===
export const analyzeHighlight = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      sentence: z.string().min(2).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { content: "", error: "Book not found" };
    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: "You are a literary annotator. Reply in 2–3 sentences. No preamble." },
          {
            role: "user",
            content: `In "${book.title}" by ${book.author}, briefly illuminate this passage — one literary insight, allusion, or thematic link:\n\n"${data.sentence}"`,
          },
        ],
      });
      return { content: result.choices?.[0]?.message?.content ?? "", error: null };
    } catch (e) {
      return { content: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === CHAPTER VISUAL ===
export const generateChapterImage = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapter: z.number().int().min(0).max(2000),
      style: z.enum(["vintage-oil", "cinematic-noir", "watercolor", "woodcut"]).default("vintage-oil"),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const book = await getBookBySlug(data.slug);
    if (!book) return { imageUrl: "", prompt: "", error: "Book not found" };

    const cacheKey = { userId: context.userId, bookId: book.id, chapter: data.chapter, kind: "visual", style: data.style };
    if (!data.force) {
      const cached = await readCache(cacheKey);
      if (cached?.image_url) {
        return {
          imageUrl: cached.image_url,
          prompt: (cached.payload as { prompt?: string })?.prompt ?? "",
          error: null,
          cached: true,
        };
      }
    }

    const ch = await getChapterText({ data: { slug: data.slug, chapter: data.chapter } });
    const sceneHint = ch.error
      ? `general atmosphere of "${book.title}" by ${book.author}`
      : `a key scene from "${ch.title}" of "${book.title}" by ${book.author}`;

    const styleMap: Record<"vintage-oil" | "cinematic-noir" | "watercolor" | "woodcut", string> = {
      "vintage-oil": "vintage oil painting, warm umber palette, Caravaggio-like chiaroscuro, weathered canvas texture",
      "cinematic-noir": "cinematic noir illustration, deep shadows, single warm light source, melancholic atmosphere",
      watercolor: "delicate watercolor etching, ivory paper, sepia and dusty rose washes, fine line work",
      woodcut: "intricate woodcut print, high contrast black and cream, art-nouveau border ornaments",
    };
    const styleDesc = styleMap[data.style as keyof typeof styleMap];

    const prompt = `An evocative ${styleDesc} depicting ${sceneHint}. No text or letters in the image. Atmospheric, literary, contemplative. Single composition.`;

    try {
      const result = await callAI({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      });
      const img = result.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
      if (img) await writeCache(cacheKey, { prompt }, img);
      return { imageUrl: img, prompt, error: img ? null : "No image returned" };
    } catch (e) {
      return { imageUrl: "", prompt, error: e instanceof Error ? e.message : "AI failed" };
    }
  });
