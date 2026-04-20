import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownProse } from "@/components/markdown-prose";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthGate } from "@/components/auth-gate";
import {
  getMentorBook,
  generateMentorOverview,
  generateMentorChapter,
  type MentorBookRow,
} from "@/server/mentor-library";
import { toast } from "sonner";

export const Route = createFileRoute("/mentor/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Mentor — ${params.slug.replace(/-/g, " ")} · Lumina Books` },
      {
        name: "description",
        content:
          "An AI-guided mentor walkthrough — overview, themes, and per-chapter notes for famous modern books we cannot host.",
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

  // Overview state
  const [overview, setOverview] = useState("");
  const [overviewLoading, setOverviewLoading] = useState(false);

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
      else if (r.book) setBook(r.book);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const loadOverview = async (fresh = false) => {
    setOverviewLoading(true);
    try {
      const r = await generateMentorOverview({ data: { slug, fresh } });
      if (r.error) toast.error(r.error);
      else setOverview(r.content);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setOverviewLoading(false);
    }
  };

  // Auto-load overview on mount
  useEffect(() => {
    if (book && !overview) loadOverview(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

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

  // Build a quick TOC: if curated chapters exist, use them; otherwise let user type.
  const hasToc = Array.isArray(book.chapters) && book.chapters.length > 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HEADER */}
      <section className="border-b border-border/60 bg-gradient-to-b from-card via-card/60 to-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[220px_1fr]">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="aspect-[2/3] overflow-hidden rounded-lg bg-secondary shadow-tome"
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mahogany to-espresso p-4 text-center text-ivory">
                <span className="font-display text-xl">{book.title}</span>
              </div>
            )}
          </motion.div>

          <div>
            <Link to="/library" className="inline-flex items-center gap-1 font-sans text-xs uppercase tracking-wider text-walnut hover:text-mahogany">
              <ArrowLeft className="h-3 w-3" /> Mentor Library
            </Link>
            <p className="mt-3 font-sans text-xs uppercase tracking-[0.35em] text-walnut">
              {book.era ?? "Modern"} · Mentor walkthrough
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-obsidian sm:text-5xl">
              {book.title}
            </h1>
            <p className="mt-1 font-sans text-sm uppercase tracking-wider text-muted-foreground">
              {book.author}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            {book.hook && (
              <p className="mt-5 max-w-2xl font-serif text-lg italic text-espresso/85">
                "{book.hook}"
              </p>
            )}
            {book.description && (
              <p className="mt-3 max-w-2xl font-serif text-base leading-relaxed text-espresso/80">
                {book.description}
              </p>
            )}
            {book.genres.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {book.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border/70 bg-background/60 px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-walnut"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-6 max-w-xl font-serif text-xs italic text-espresso/60">
              We don't host the full text of this book — your mentor draws on what they
              already know to summarize, analyze, and discuss it with you.
            </p>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl text-obsidian">
            <Sparkles className="h-4 w-4 text-gold" /> Overview
          </h2>
          {overview && (
            <Button variant="ghost" size="sm" onClick={() => loadOverview(true)} disabled={overviewLoading}>
              <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
            </Button>
          )}
        </div>
        {overviewLoading && !overview ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        ) : overview ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8">
            <MarkdownProse content={overview} />
          </div>
        ) : (
          <Button onClick={() => loadOverview(false)}>
            <Sparkles className="mr-2 h-3 w-3" /> Generate overview
          </Button>
        )}
      </section>

      {/* CHAPTER GUIDE */}
      <section className="border-t border-border/50 bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[300px_1fr]">
          <aside>
            <h3 className="font-display text-xl text-obsidian">Chapters</h3>
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
                      <ChevronRight className={`h-3 w-3 flex-shrink-0 ${isActive ? "" : "text-muted-foreground"}`} />
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
            {!chapterIndex && chapterIndex !== 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/60 p-10 text-center">
                <p className="font-serif italic text-espresso/70">
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
              <div className="rounded-2xl border border-border/60 bg-card p-8">
                <p className="mb-2 font-sans text-xs uppercase tracking-[0.3em] text-walnut">
                  Chapter {chapterIndex + 1}
                </p>
                <h3 className="mb-6 font-display text-2xl text-obsidian">{chapterLabel}</h3>
                <MarkdownProse content={chapterContent} />
                <Button
                  onClick={() => loadChapter(chapterIndex, chapterLabel, true)}
                  variant="ghost"
                  size="sm"
                  className="mt-6 text-walnut"
                >
                  <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
                </Button>
              </div>
            ) : null}
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
