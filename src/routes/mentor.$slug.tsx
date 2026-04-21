import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  BookOpen,
  Calendar,
  Tag,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownProse } from "@/components/markdown-prose";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthGate } from "@/components/auth-gate";
import { Ornament } from "@/components/ornament";
import { MentorDossier } from "@/components/mentor/mentor-dossier";
import {
  getMentorBook,
  generateMentorChapter,
  type MentorBookRow,
} from "@/server/mentor-library";
import { ensureMentorCover } from "@/server/mentor-dossier";
import { toast } from "sonner";

export const Route = createFileRoute("/mentor/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Mentor — ${params.slug.replace(/-/g, " ")} · Lumina Books` },
      {
        name: "description",
        content:
          "An AI-guided mentor walkthrough — synopsis, themes, characters, context, and per-chapter notes for famous modern books.",
      },
    ],
  }),
  component: MentorRoute,
});

function MentorRoute() {
  return (
    <AuthGate>
      <MentorBookPage />
    </AuthGate>
  );
}

function MentorBookPage() {
  const { slug } = Route.useParams();
  const [book, setBook] = useState<MentorBookRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter state
  const [chapterIndex, setChapterIndex] = useState<number | null>(null);
  const [chapterLabel, setChapterLabel] = useState<string>("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterLoading, setChapterLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMentorBook({ data: { slug } }).then((r) => {
      if (!active) return;
      if (r.error) setError(r.error);
      else if (r.book) {
        setBook(r.book);
        // Backfill cover lazily if missing — UX nicety, doesn't block.
        if (!r.book.cover_url) {
          ensureMentorCover({ data: { slug } })
            .then((res) => {
              if (active && res.cover && r.book) {
                setBook({ ...r.book, cover_url: res.cover });
              }
            })
            .catch(() => {});
        }
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const loadChapter = async (idx: number, label: string, fresh = false) => {
    if (!label.trim()) {
      toast.error("Type a chapter title or number first.");
      return;
    }
    setChapterIndex(idx);
    setChapterLabel(label);
    setChapterContent("");
    setChapterLoading(true);
    try {
      const r = await generateMentorChapter({
        data: { slug, chapterIndex: idx, chapterLabel: label.trim(), fresh },
      });
      if (r.error) toast.error(r.error);
      else setChapterContent(r.content);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setChapterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center text-walnut">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-serif italic text-espresso">{error ?? "Book not found."}</p>
          <Link to="/library" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-3 w-3" /> Back to library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasToc = Array.isArray(book.chapters) && book.chapters.length > 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* EDITORIAL HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 paper-texture" aria-hidden />
        <div className="grain absolute inset-0 opacity-50" aria-hidden />
        {/* Blurred cover backdrop for atmosphere */}
        {book.cover_url && (
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${book.cover_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(0.7)",
              transform: "scale(1.1)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[260px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-secondary shadow-tome ring-1 ring-walnut/20">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-mahogany to-espresso p-6 text-center text-ivory">
                  <span className="font-display text-2xl leading-tight">{book.title}</span>
                  <span className="mt-3 text-xs uppercase tracking-[0.2em] opacity-70">
                    {book.author}
                  </span>
                </div>
              )}
            </div>
            {/* Decorative gold spine */}
            <div className="spine-accent absolute -left-1.5 top-2 h-[calc(100%-1rem)] w-1 rounded" aria-hidden />
            {/* Mentor badge */}
            <span className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-obsidian shadow-leaf">
              <Sparkles className="h-3 w-3" /> Mentor
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link
              to="/library"
              className="inline-flex items-center gap-1 font-sans text-[11px] uppercase tracking-[0.25em] text-walnut hover:text-mahogany"
            >
              <ArrowLeft className="h-3 w-3" /> Mentor Library
            </Link>

            <Ornament variant="diamond" className="mt-5" />

            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-obsidian sm:text-5xl md:text-6xl">
              {book.title}
            </h1>
            <p className="mt-2 font-display text-xl italic text-walnut">
              by {book.author}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-xs uppercase tracking-[0.2em] text-espresso/70">
              {book.year && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {book.year}
                </span>
              )}
              {book.era && (
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> {book.era}
                </span>
              )}
              {book.total_chapters > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> {book.total_chapters} chapters
                </span>
              )}
            </div>

            {book.hook && (
              <p className="mt-7 max-w-2xl border-l-2 border-gold/60 pl-4 font-serif text-lg italic leading-relaxed text-espresso/90">
                {book.hook}
              </p>
            )}
            {book.description && (
              <p className="mt-4 max-w-2xl font-serif text-base leading-relaxed text-espresso/80">
                {book.description}
              </p>
            )}

            {book.genres.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {book.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-walnut"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-7 max-w-xl border-t border-border/50 pt-4 font-serif text-xs italic text-espresso/55">
              Lumina cannot host the full text of modern works. Instead, your mentor
              draws on what they already know to walk you through the book —
              chapter by chapter, theme by theme.
            </p>
          </motion.div>
        </div>
      </section>

      {/* DOSSIER */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-walnut">
            Mentor's dossier
          </p>
          <h2 className="mt-3 font-display text-3xl text-obsidian sm:text-4xl">
            Everything you need <em className="font-normal italic text-walnut">before you begin</em>
          </h2>
          <Ornament variant="rule" className="mt-5" />
        </div>

        <MentorDossier slug={slug} />
      </section>

      {/* CHAPTER GUIDE */}
      <section className="border-t border-border/50 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-walnut">
              Chapter by chapter
            </p>
            <h2 className="mt-3 font-display text-3xl text-obsidian sm:text-4xl">
              Walk through it <em className="font-normal italic text-walnut">page by page</em>
            </h2>
            <Ornament variant="rule" className="mt-5" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside>
              <h3 className="font-display text-lg text-obsidian">Chapters</h3>
              <p className="mt-1 font-serif text-xs italic text-espresso/60">
                Pick a chapter or type any section title.
              </p>

              <div className="mt-4 space-y-2">
                {hasToc ? (
                  book.chapters.map((c, i) => {
                    const isActive = chapterIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => loadChapter(i, c.title)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                          isActive
                            ? "border-walnut bg-walnut text-ivory"
                            : "border-border bg-background hover:border-gold/60"
                        }`}
                      >
                        <span className="min-w-0 truncate font-serif text-sm">
                          {c.title}
                        </span>
                        <ChevronRight
                          className={`h-3 w-3 flex-shrink-0 ${
                            isActive ? "" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    );
                  })
                ) : (
                  <ManualChapterPicker
                    totalEstimate={book.total_chapters}
                    onPick={(idx, label) => loadChapter(idx, label)}
                  />
                )}
              </div>
            </aside>

            <div className="min-h-[200px]">
              {chapterIndex === null ? (
                <div className="rounded-2xl border border-dashed border-border bg-background/60 p-10 text-center">
                  <Ornament variant="diamond" className="mx-auto" />
                  <p className="mt-4 font-serif italic text-espresso/70">
                    Select a chapter to receive a mentor's guide.
                  </p>
                </div>
              ) : chapterLoading ? (
                <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-6">
                  <div className="flex items-center gap-2 text-sm text-walnut">
                    <Loader2 className="h-4 w-4 animate-spin" /> The mentor is thinking…
                  </div>
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-10/12" />
                </div>
              ) : chapterContent ? (
                <article className="rounded-2xl border border-border/60 bg-card p-8 shadow-paper">
                  <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-walnut">
                    Chapter {chapterIndex + 1}
                  </p>
                  <h3 className="mb-2 font-display text-2xl text-obsidian">{chapterLabel}</h3>
                  <Ornament variant="diamond" className="mb-6" />
                  <MarkdownProse content={chapterContent} />
                  <Button
                    onClick={() => loadChapter(chapterIndex, chapterLabel, true)}
                    variant="ghost"
                    size="sm"
                    className="mt-6 text-walnut"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
                  </Button>
                </article>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ManualChapterPicker({
  totalEstimate,
  onPick,
}: {
  totalEstimate: number;
  onPick: (idx: number, label: string) => void;
}) {
  const [num, setNum] = useState("1");
  const [label, setLabel] = useState("");
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div>
        <Label htmlFor="ch-num" className="text-xs">
          Chapter # (of ~{totalEstimate || "?"})
        </Label>
        <Input
          id="ch-num"
          value={num}
          onChange={(e) => setNum(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="3"
          inputMode="numeric"
        />
      </div>
      <div>
        <Label htmlFor="ch-label" className="text-xs">
          Chapter title (optional)
        </Label>
        <Input
          id="ch-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='e.g. "The Hounds of God"'
        />
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={() => {
          const n = Math.max(1, parseInt(num || "1", 10));
          const finalLabel = label.trim() || `Chapter ${n}`;
          onPick(n - 1, finalLabel);
        }}
      >
        <Sparkles className="mr-2 h-3 w-3" /> Generate guide
      </Button>
    </div>
  );
}
