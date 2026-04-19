import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const INPUT = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(200).optional(),
  mode: z.enum(["overview", "chapter"]),
  chapterLabel: z.string().max(120).optional(),
  fresh: z.boolean().optional(),
});

export const summarizeByTitle = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(INPUT)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const titleNorm = data.title.trim();
    const authorNorm = data.author?.trim() || null;
    const chapterNorm = data.chapterLabel?.trim() || null;

    // Cache lookup
    if (!data.fresh) {
      let q = supabase
        .from("title_summaries")
        .select("content,created_at")
        .eq("user_id", userId)
        .eq("title", titleNorm)
        .eq("mode", data.mode);
      if (authorNorm) q = q.eq("author", authorNorm);
      else q = q.is("author", null);
      if (chapterNorm) q = q.eq("chapter_label", chapterNorm);
      else q = q.is("chapter_label", null);
      const cached = await q.maybeSingle();
      if (cached.data?.content) {
        return { content: cached.data.content, cached: true, error: null };
      }
    }

    const systemBase =
      "You are a meticulous literary scholar at Lumina Books. Write in confident, elegant prose with markdown headings (##), bullet lists, and the occasional pulled quotation. Never invent fictitious passages — if you do not know specific dialogue, paraphrase. Never reproduce more than ~50 words of any copyrighted text. If the work is genuinely unfamiliar to you, say so plainly rather than fabricating.";

    const titleLine = authorNorm ? `"${titleNorm}" by ${authorNorm}` : `"${titleNorm}"`;

    let userPrompt: string;
    if (data.mode === "overview") {
      userPrompt = `Provide a rich literary overview of ${titleLine}. Include:

## Synopsis
A 2-3 paragraph spoiler-aware plot summary.

## Themes
3-5 major themes with one-sentence elaborations.

## Style & Form
What makes the prose, structure, or voice distinctive.

## Why It Endures
The cultural / literary significance — why critics and readers still return to it.

## A Note Before You Read
One short paragraph (warm, mentor-like) on what to watch for as a first-time reader.`;
    } else {
      const chLine = chapterNorm ? ` — focus on "${chapterNorm}"` : "";
      userPrompt = `For ${titleLine}${chLine}, produce a chapter-level study guide structured as:

## What Happens
A focused plot summary of this chapter / section (4-6 sentences). If you are unsure which chapter "${chapterNorm ?? ""}" refers to, ask the reader to be more specific instead of guessing.

## Key Moments
2-4 bullet points naming pivotal beats.

## Craft Notes
What the author is doing technically — point of view, imagery, foreshadowing, etc.

## Discussion Question
One open-ended question worth pondering after reading.`;
    }

    let content: string;
    try {
      content = await callAI([
        { role: "system", content: systemBase },
        { role: "user", content: userPrompt },
      ]);
    } catch (e) {
      return { content: "", cached: false, error: e instanceof Error ? e.message : "AI request failed" };
    }

    if (!content || content.length < 40) {
      return { content: "", cached: false, error: "The AI returned an empty response. Try again." };
    }

    // Cache (best-effort)
    await supabase
      .from("title_summaries")
      .insert({
        user_id: userId,
        title: titleNorm,
        author: authorNorm,
        mode: data.mode,
        chapter_label: chapterNorm,
        content,
      });

    return { content, cached: false, error: null };
  });

export const listMyTitleSummaries = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
      .from("title_summaries")
      .select("id,title,author,mode,chapter_label,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (r.error) return { items: [], error: r.error.message };
    return { items: r.data ?? [], error: null };
  });

export const deleteTitleSummary = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("title_summaries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
