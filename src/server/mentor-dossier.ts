// Rich multi-section mentor dossier.
// One row per (slug, section) cached in mentor_dossier_sections.
// Sections are public — anyone can read; the server (admin client) writes.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveCover } from "@/server/covers";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export const DOSSIER_SECTIONS = [
  "synopsis",
  "themes",
  "characters",
  "context",
  "style",
  "why-it-endures",
  "how-to-read",
  "companions",
  "content-notes",
] as const;
export type DossierSection = (typeof DOSSIER_SECTIONS)[number];

const SECTION_LABELS: Record<DossierSection, string> = {
  synopsis: "Synopsis",
  themes: "Themes",
  characters: "Key Characters",
  context: "Historical & Literary Context",
  style: "Style & Form",
  "why-it-endures": "Why It Endures",
  "how-to-read": "How to Read It",
  companions: "Companion Works",
  "content-notes": "Content Notes",
};

const SECTION_PROMPTS: Record<DossierSection, string> = {
  synopsis:
    "Write a 2–3 paragraph spoiler-aware synopsis. Begin with a one-sentence hook in italics. Use markdown.",
  themes:
    "List 4–6 major themes as `### Title` headings, each followed by a 2–3 sentence elaboration. Stay literary, not academic.",
  characters:
    "Identify the 4–8 most important characters. For each, use `### Name` then a 2-sentence portrait: who they are and what they want.",
  context:
    "Place the book in its historical and literary moment in 2–3 paragraphs. What was happening in the world and in literature when it appeared? How was it received?",
  style:
    "What makes the prose, structure, narration, or form distinctive? 2 paragraphs, concrete and craft-focused. Cite techniques (POV, time, imagery) — never quote more than ~10 words.",
  "why-it-endures":
    "Why is this book still read decades later? 2 paragraphs on its lasting cultural and emotional weight.",
  "how-to-read":
    "Give the reader a friendly 2-paragraph mentor's preparation: what to pay attention to, what might surprise them, how to pace it. Address the reader as 'you'.",
  companions:
    "Suggest 4–6 companion works (other books, films, essays) that pair beautifully with this one. For each, use `### Title — Author/Director (year)` then a one-sentence reason.",
  "content-notes":
    "List any notable themes a reader might want forewarning about (violence, abuse, racial slurs of the period, etc.). Be neutral, brief, and honest. If nothing notable, write a single sentence saying so.",
};

interface DossierRow {
  section: string;
  content: string;
  updated_at: string;
}

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
  return (json?.choices?.[0]?.message?.content ?? "") as string;
}

function buildSystem() {
  return "You are a meticulous literary mentor at Lumina Books. Write in confident, elegant prose. Use markdown. Never reproduce more than ~50 words of any copyrighted text — paraphrase always. If something is genuinely unknown about the book, say so plainly rather than invent.";
}

/** Fetch all cached dossier sections for a slug. */
export const getMentorDossier = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const r = await supabaseAdmin
      .from("mentor_dossier_sections")
      .select("section,content,updated_at")
      .eq("slug", data.slug);
    if (r.error) return { sections: [] as DossierRow[], error: r.error.message };
    return { sections: (r.data ?? []) as DossierRow[], error: null };
  });

/** Generate a single dossier section (and cache it). */
export const generateDossierSection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      section: z.enum(DOSSIER_SECTIONS),
      fresh: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!data.fresh) {
      const cached = await supabaseAdmin
        .from("mentor_dossier_sections")
        .select("content")
        .eq("slug", data.slug)
        .eq("section", data.section)
        .maybeSingle();
      if (cached.data?.content) {
        return { content: cached.data.content, cached: true, error: null };
      }
    }

    const book = await supabaseAdmin
      .from("mentor_books")
      .select("title,author,year")
      .eq("slug", data.slug)
      .maybeSingle();
    if (book.error || !book.data) {
      return { content: "", cached: false, error: "Mentor book not found" };
    }
    const b = book.data;

    const userMsg = `Book: "${b.title}" by ${b.author}${b.year ? ` (${b.year})` : ""}.

Section: ${SECTION_LABELS[data.section]}.

${SECTION_PROMPTS[data.section]}

Length: ~150–280 words. Use markdown. Do NOT include the section title as a top-level heading — it will be rendered above your content.`;

    let content: string;
    try {
      content = await callAI([
        { role: "system", content: buildSystem() },
        { role: "user", content: userMsg },
      ]);
    } catch (e) {
      return { content: "", cached: false, error: e instanceof Error ? e.message : "AI failed" };
    }
    if (!content || content.length < 30) {
      return { content: "", cached: false, error: "Empty AI response." };
    }

    // Upsert (UNIQUE on slug+section)
    await supabaseAdmin
      .from("mentor_dossier_sections")
      .upsert(
        { slug: data.slug, section: data.section, content },
        { onConflict: "slug,section" },
      );

    return { content, cached: false, error: null };
  });

/** Backfill cover for a single mentor book if missing. Public — safe; the
 *  resolver only hits Open Library and Google Books which are open APIs. */
export const ensureMentorCover = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const r = await supabaseAdmin
      .from("mentor_books")
      .select("title,author,cover_url")
      .eq("slug", data.slug)
      .maybeSingle();
    if (r.error || !r.data) return { ok: false, cover: null, error: "not found" };
    if (r.data.cover_url) return { ok: true, cover: r.data.cover_url, error: null };
    const cover = await resolveCover({ title: r.data.title, author: r.data.author });
    if (cover) {
      await supabaseAdmin
        .from("mentor_books")
        .update({ cover_url: cover })
        .eq("slug", data.slug);
    }
    return { ok: !!cover, cover, error: null };
  });

/** Bulk backfill mentor covers — admin-only entry, but the operation is read-only
 *  to upstream APIs and only writes back our own table, so safe to expose. */
export const backfillMentorCovers = createServerFn({ method: "POST" }).handler(async () => {
  const rows = await supabaseAdmin
    .from("mentor_books")
    .select("slug,title,author,cover_url")
    .or("cover_url.is.null,cover_url.eq.");
  if (rows.error) return { updated: 0, total: 0, error: rows.error.message };

  let updated = 0;
  for (const b of rows.data ?? []) {
    const cover = await resolveCover({ title: b.title, author: b.author });
    if (cover) {
      await supabaseAdmin.from("mentor_books").update({ cover_url: cover }).eq("slug", b.slug);
      updated++;
    }
  }
  return { updated, total: rows.data?.length ?? 0, error: null };
});

export { SECTION_LABELS };
