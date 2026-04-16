import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChapterText } from "./gutenberg";
import { getBook } from "@/lib/catalog";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

function chapterContext(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  // Take beginning + middle + end snapshots
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

// === SUMMARY ===
export const generateChapterSummary = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const book = getBook(data.bookId);
    if (!book) return { content: "", error: "Book not found" };
    const ch = await getChapterText({ data });
    if (ch.error || !ch.text) return { content: "", error: ch.error ?? "No text" };

    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a literary scholar with the warmth of a beloved professor. Write in clear, beautiful prose — no bullet-point fluff. Use markdown headings.",
          },
          {
            role: "user",
            content: `Write a long-form scholarly analysis of this chapter from "${book.title}" by ${book.author} (${book.year}).

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
      return { content: result.choices?.[0]?.message?.content ?? "", error: null };
    } catch (e) {
      return { content: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === MENTOR ===
export const generateMentorGuide = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const book = getBook(data.bookId);
    if (!book) return { content: "", error: "Book not found" };
    const ch = await getChapterText({ data });
    if (ch.error) return { content: "", error: ch.error };

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
            content: `Prepare the reader for "${ch.title}" of "${book.title}" by ${book.author}.

Use these sections:
## What to Expect (no spoilers beyond chapter end)
## Historical Background
## Symbolism to Watch For
## Vocabulary & References (5–8 terms with brief glosses)
## A Reading Strategy

Be specific to this chapter. 600–900 words total.

Chapter excerpt:
${chapterContext(ch.text, 6000)}`,
          },
        ],
      });
      return { content: result.choices?.[0]?.message?.content ?? "", error: null };
    } catch (e) {
      return { content: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === ASK THE BOOK (chat) ===
export const askTheBook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
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
  .handler(async ({ data }) => {
    const book = getBook(data.bookId);
    if (!book) return { reply: "", error: "Book not found" };
    const ch = await getChapterText({ data: { bookId: data.bookId, chapter: data.chapter } });
    if (ch.error) return { reply: "", error: ch.error };

    const toneInstr = {
      scholarly: "Respond with the precision of a literary critic. Cite specific lines when relevant.",
      casual: "Respond like a thoughtful friend who loves this book. Warm, plainspoken.",
      socratic: "Respond by asking the reader sharper questions back. Help them discover.",
    }[data.tone];

    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an AI companion grounded in "${book.title}" by ${book.author}, currently scoped to chapter "${ch.title}". ${toneInstr} If a question requires events past this chapter, gently say so. Keep replies under 350 words. Quote the text when citing.`,
          },
          {
            role: "system",
            content: `Chapter text for grounding:\n${chapterContext(ch.text, 8000)}`,
          },
          ...data.messages,
        ],
      });
      return { reply: result.choices?.[0]?.message?.content ?? "", error: null };
    } catch (e) {
      return { reply: "", error: e instanceof Error ? e.message : "AI failed" };
    }
  });

// === HIGHLIGHT MICRO-ANALYSIS ===
export const analyzeHighlight = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
      sentence: z.string().min(2).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const book = getBook(data.bookId);
    if (!book) return { content: "", error: "Book not found" };
    try {
      const result = await callAI({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a literary annotator. Reply in 2–3 sentences. No preamble.",
          },
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
  .inputValidator(
    z.object({
      bookId: z.string().min(1).max(100),
      chapter: z.number().int().min(0).max(500),
      style: z.enum(["vintage-oil", "cinematic-noir", "watercolor", "woodcut"]).default("vintage-oil"),
    }),
  )
  .handler(async ({ data }) => {
    const book = getBook(data.bookId);
    if (!book) return { imageUrl: "", prompt: "", error: "Book not found" };
    const ch = await getChapterText({ data: { bookId: data.bookId, chapter: data.chapter } });
    if (ch.error) return { imageUrl: "", prompt: "", error: ch.error };

    const styleDesc = {
      "vintage-oil": "vintage oil painting, warm umber palette, Caravaggio-like chiaroscuro, weathered canvas texture",
      "cinematic-noir": "cinematic noir illustration, deep shadows, single warm light source, melancholic atmosphere",
      watercolor: "delicate watercolor etching, ivory paper, sepia and dusty rose washes, fine line work",
      woodcut: "intricate woodcut print, high contrast black and cream, art-nouveau border ornaments",
    }[data.style];

    const prompt = `An evocative ${styleDesc} depicting a key scene from "${ch.title}" of "${book.title}" by ${book.author}. No text or letters in the image. Atmospheric, literary, contemplative. Single composition.`;

    try {
      const result = await callAI({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      });
      const img = result.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
      return { imageUrl: img, prompt, error: img ? null : "No image returned" };
    } catch (e) {
      return { imageUrl: "", prompt, error: e instanceof Error ? e.message : "AI failed" };
    }
  });
