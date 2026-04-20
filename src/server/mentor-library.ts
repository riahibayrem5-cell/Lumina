import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/integrations/supabase/auth-helpers";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(messages: Array<{ role: string; content: string }>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Pause a moment and retry.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

export interface MentorBookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  year: number | null;
  era: string | null;
  genres: string[];
  moods: string[];
  cover_url: string | null;
  hook: string | null;
  description: string | null;
  total_chapters: number;
  chapters: Array<{ index: number; title: string; blurb?: string }>;
  featured: boolean;
}

// Public read — uses admin client because RLS allows public SELECT and we
// want this callable without the user being signed in.
export const listMentorBooks = createServerFn({ method: "GET" }).handler(async () => {
  const r = await supabaseAdmin
    .from("mentor_books")
    .select("id,slug,title,author,year,era,genres,moods,cover_url,hook,description,total_chapters,featured")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (r.error) return { books: [] as MentorBookRow[], error: r.error.message };
  return { books: (r.data ?? []) as MentorBookRow[], error: null };
});

export const getMentorBook = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const r = await supabaseAdmin
      .from("mentor_books")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (r.error) return { book: null, error: r.error.message };
    if (!r.data) return { book: null, error: "Mentor book not found" };
    return { book: r.data as unknown as MentorBookRow, error: null };
  });

// Generate a mentor overview (cached per user in title_summaries) for a curated mentor book.
export const generateMentorOverview = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().min(1).max(120), fresh: z.boolean().optional() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const book = await supabaseAdmin
      .from("mentor_books")
      .select("title,author,description,hook,year,era")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) return { content: "", cached: false, error: "Mentor book not found" };
    const b = book.data;

    if (!data.fresh) {
      const cached = await supabase
        .from("title_summaries")
        .select("content")
        .eq("user_id", userId)
        .eq("title", b.title)
        .eq("author", b.author)
        .eq("mode", "overview")
        .is("chapter_label", null)
        .maybeSingle();
      if (cached.data?.content) return { content: cached.data.content, cached: true, error: null };
    }

    const system =
      "You are a meticulous literary mentor at Lumina Books. Write in confident, elegant prose with markdown headings (##) and bullets. Never reproduce more than ~50 words of any copyrighted text — paraphrase always. If something is genuinely unknown, say so plainly.";
    const user = `Write a rich literary overview of "${b.title}" by ${b.author}${b.year ? ` (${b.year})` : ""}.

Structure:

## Synopsis
2–3 paragraph spoiler-aware summary.

## Themes
4–5 major themes with brief elaborations.

## Style & Form
What makes the prose, structure, or voice distinctive.

## Why It Endures
Cultural / literary significance.

## Before You Begin
A warm, mentor-like paragraph on what to watch for.`;

    let content: string;
    try {
      content = await callAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
    } catch (e) {
      return { content: "", cached: false, error: e instanceof Error ? e.message : "AI failed" };
    }
    if (!content || content.length < 60) {
      return { content: "", cached: false, error: "Empty response from AI." };
    }
    await supabase.from("title_summaries").insert({
      user_id: userId,
      title: b.title,
      author: b.author,
      mode: "overview",
      chapter_label: null,
      content,
    });
    return { content, cached: false, error: null };
  });

// Generate per-chapter mentor guide for a curated mentor book.
export const generateMentorChapter = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      chapterIndex: z.number().int().min(0).max(500),
      chapterLabel: z.string().min(1).max(200),
      fresh: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const book = await supabaseAdmin
      .from("mentor_books")
      .select("title,author")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) return { content: "", cached: false, error: "Mentor book not found" };
    const b = book.data;

    if (!data.fresh) {
      const cached = await supabase
        .from("title_summaries")
        .select("content")
        .eq("user_id", userId)
        .eq("title", b.title)
        .eq("author", b.author)
        .eq("mode", "chapter")
        .eq("chapter_label", data.chapterLabel)
        .maybeSingle();
      if (cached.data?.content) return { content: cached.data.content, cached: true, error: null };
    }

    const system =
      "You are a meticulous literary mentor. Use markdown with ## headings and bullets. Never reproduce more than ~50 words of any copyrighted source — always paraphrase. If you're not certain which chapter the reader means, say so and offer the most likely interpretation.";
    const user = `For "${b.title}" by ${b.author}, give a mentor guide for "${data.chapterLabel}" (chapter ${data.chapterIndex + 1}).

Structure:

## What Happens
4–6 sentence spoiler-aware plot summary of this chapter.

## Key Moments
2–4 bullet points naming pivotal beats.

## Craft Notes
What the author is doing technically — POV, imagery, foreshadowing, etc.

## Mentor's Marginalia
1 short paragraph: what to watch for as you read this chapter.

## Discussion Question
One open-ended question to sit with afterward.`;

    let content: string;
    try {
      content = await callAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
    } catch (e) {
      return { content: "", cached: false, error: e instanceof Error ? e.message : "AI failed" };
    }
    if (!content || content.length < 60) {
      return { content: "", cached: false, error: "Empty AI response." };
    }
    await supabase.from("title_summaries").insert({
      user_id: userId,
      title: b.title,
      author: b.author,
      mode: "chapter",
      chapter_label: data.chapterLabel,
      content,
    });
    return { content, cached: false, error: null };
  });
