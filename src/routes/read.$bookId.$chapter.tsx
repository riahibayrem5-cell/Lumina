import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Type, Settings2, X, AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { SummaryTab } from "@/components/reader/summary-tab";
import { MentorTab } from "@/components/reader/mentor-tab";
import { VisualsTab } from "@/components/reader/visuals-tab";
import { ChatTab } from "@/components/reader/chat-tab";
import { AudioTab } from "@/components/reader/audio-tab";
import { HighlightTooltip } from "@/components/reader/highlight-tooltip";
import { useReadingStore } from "@/store/reading";
import { getBook } from "@/lib/catalog";
import { getChapterText, getBookChapters } from "@/server/gutenberg";
import { getBookHeaderInfo } from "@/server/book-meta";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/lib/auth-context";
import { upsertProgress } from "@/server/library";
import { cleanChapterTitle } from "@/lib/chapter-title";

export const Route = createFileRoute("/read/$bookId/$chapter")({
  head: ({ params }) => {
    const book = getBook(params.bookId);
    const title = book ? `${book.title} — Lumina Books` : "Reading — Lumina Books";
    const desc = book
      ? `Read ${book.title} by ${book.author} with an AI literary companion.`
      : "Read with an AI literary companion.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: ReaderRoute,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <h1 className="font-display text-3xl">Book not found</h1>
        <Link to="/" className="mt-4 inline-block text-walnut underline">
          Return to the library
        </Link>
      </div>
    </div>
  ),
});

function ReaderRoute() {
  return (
    <AuthGate>
      <ReaderPage />
    </AuthGate>
  );
}

function ReaderPage() {
  const params = Route.useParams();
  const bookId = params.bookId;
  const chapter = parseInt(params.chapter, 10) || 0;
  const navigate = useNavigate();
  const isUpload = bookId.startsWith("upload-");
  const curatedBook = getBook(bookId);

  const [text, setText] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [totalChapters, setTotalChapters] = useState(0);
  const [chaptersList, setChaptersList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<{ title: string; author: string } | null>(null);

  const settings = useReadingStore((s) => s.settings);
  const setSettings = useReadingStore((s) => s.setSettings);
  const setProgress = useReadingStore((s) => s.setProgress);
  const progress = useReadingStore((s) => s.progress[bookId]);
  const { session } = useAuth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [highlight, setHighlight] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // For uploads, fetch metadata since it's not in the static catalog
  useEffect(() => {
    if (!isUpload) return;
    let active = true;
    getBookHeaderInfo({ data: { slug: bookId } }).then((r) => {
      if (active && r.book) {
        setUploadMeta({ title: r.book.title, author: r.book.author });
      }
    });
    return () => {
      active = false;
    };
  }, [isUpload, bookId]);

  const book = curatedBook ?? (uploadMeta ? { id: bookId, title: uploadMeta.title, author: uploadMeta.author } : null);

  // Fetch chapter text
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setText("");
    Promise.all([
      getChapterText({ data: { slug: bookId, chapter } }),
      getBookChapters({ data: { slug: bookId } }),
    ])
      .then(([chRes, allRes]) => {
        if (!active) return;
        if (chRes.error) {
          setError(chRes.error);
        } else {
          setText(chRes.text);
          setChapterTitle(chRes.title);
          setTotalChapters(chRes.total);
        }
        if (!allRes.error) {
          // derive titles, normalized via cleanChapterTitle
          setChaptersList(
            allRes.chapters.map((c, i) => {
              const nl = c.indexOf("\n");
              const raw = nl > 0 ? c.slice(0, nl).trim() : "";
              return cleanChapterTitle(raw, i);
            }),
          );
        }
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [bookId, chapter]);

  // Restore scroll & autosave progress
  useEffect(() => {
    if (!text || !scrollRef.current) return;
    const el = scrollRef.current;
    const initial = progress?.chapter === chapter ? progress.scrollRatio : 0;
    el.scrollTop = initial * (el.scrollHeight - el.clientHeight);
  }, [text, chapter, progress?.chapter, progress?.scrollRatio]);

  useEffect(() => {
    if (!text) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const ratio =
        el.scrollHeight > el.clientHeight
          ? el.scrollTop / (el.scrollHeight - el.clientHeight)
          : 0;
      setScrollPct(Math.min(1, Math.max(0, ratio)));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const interval = setInterval(() => {
      const ratio =
        el.scrollHeight > el.clientHeight
          ? el.scrollTop / (el.scrollHeight - el.clientHeight)
          : 0;
      setProgress(bookId, {
        chapter,
        scrollRatio: ratio,
        totalChapters,
        status: "reading",
      });
      // Push to DB if signed in (best-effort, fire-and-forget)
      if (session) {
        upsertProgress({
          data: { slug: bookId, chapter, scrollRatio: ratio, status: "reading" },
        }).catch(() => {});
      }
    }, 5000);
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearInterval(interval);
    };
  }, [text, bookId, chapter, totalChapters, setProgress, session]);

  // Sentence selection handler
  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setHighlight(null);
      return;
    }
    const selText = sel.toString().trim();
    if (selText.length < 6 || selText.length > 600) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setHighlight({
      text: selText,
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    });
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[role='dialog']")) setHighlight(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fontStyle = useMemo(
    () => ({
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineHeight,
    }),
    [settings],
  );

  if (!book) {
    if (isUpload && !uploadMeta && !error) {
      return (
        <div className="grid min-h-screen place-items-center text-walnut">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-serif italic">Book not found.</p>
      </div>
    );
  }

  const goChapter = (n: number) => {
    if (n < 0 || (totalChapters && n >= totalChapters)) return;
    navigate({ to: "/read/$bookId/$chapter", params: { bookId, chapter: String(n) } });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Reader chrome */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base text-obsidian sm:text-lg">
              {book.title}{" "}
              <span className="font-sans text-xs font-normal uppercase tracking-wider text-muted-foreground">
                · {book.author}
              </span>
            </h1>
          </div>

          <Select
            value={String(chapter)}
            onValueChange={(v) => goChapter(parseInt(v, 10))}
          >
            <SelectTrigger className="w-48 bg-background">
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent>
              {chaptersList.map((title, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i + 1}. {title.length > 38 ? title.slice(0, 38) + "…" : title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goChapter(chapter - 1)}
              disabled={chapter <= 0}
              aria-label="Previous chapter"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goChapter(chapter + 1)}
              disabled={!totalChapters || chapter >= totalChapters - 1}
              aria-label="Next chapter"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <ReadingControls />

          {/* Mobile AI panel trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" size="sm" className="lg:hidden">
                AI Companion
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="font-display">Companion</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <AICompanion bookId={bookId} chapter={chapter} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Slim chapter scroll progress bar */}
        <div className="h-[3px] bg-border/40">
          <div
            className="h-full bg-gradient-to-r from-walnut via-mahogany to-gold transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(scrollPct * 100)}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-0 px-0 lg:grid-cols-[1fr_28rem]">
        {/* READER PANE */}
        <main className="relative" ref={scrollRef} style={{ overflowY: "auto", maxHeight: "calc(100vh - 8rem)" }}>
          <article
            className="mx-auto max-w-2xl px-6 py-12 sm:px-8"
            onMouseUp={onMouseUp}
          >
            {chapterTitle && (
              <header className="mb-10 border-b border-border/60 pb-6 text-center">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-walnut">
                  Chapter {chapter + 1}
                  {totalChapters ? ` of ${totalChapters}` : ""}
                </p>
                <h2 className="mt-3 font-display text-3xl text-obsidian sm:text-4xl">
                  {chapterTitle}
                </h2>
              </header>
            )}

            {loading && (
              <div className="grid place-items-center py-20 text-walnut">
                <Loader2 className="mb-3 h-6 w-6 animate-spin" />
                <p className="font-serif italic">Fetching the page from the archive…</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-display text-lg text-obsidian">A pause in the archive.</p>
                    <p className="mt-1 font-serif italic text-espresso/80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {text && (
              <div className="prose-reader" style={fontStyle}>
                {text.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para.replace(/\n/g, " ")}</p>
                ))}
              </div>
            )}
          </article>
        </main>

        {/* AI PANEL (desktop) */}
        <aside className="hidden border-l border-border/60 bg-card/30 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-6">
            <AICompanion bookId={bookId} chapter={chapter} />
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {highlight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <HighlightTooltip
              bookId={bookId}
              chapter={chapter}
              sentence={highlight.text}
              position={{ x: highlight.x, y: highlight.y }}
              onClose={() => setHighlight(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReadingControls() {
  const settings = useReadingStore((s) => s.settings);
  const setSettings = useReadingStore((s) => s.setSettings);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Reading settings">
        <Type className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-popover p-4 shadow-tome">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm text-obsidian">Typography</p>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-sans text-xs uppercase tracking-wider text-walnut">
                Size · {settings.fontSize}px
              </label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([v]) => setSettings({ fontSize: v })}
                min={14}
                max={26}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <label className="font-sans text-xs uppercase tracking-wider text-walnut">
                Line height · {settings.lineHeight.toFixed(2)}
              </label>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={([v]) => setSettings({ lineHeight: v })}
                min={1.4}
                max={2.2}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AICompanion({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [tab, setTab] = useState("summary");
  const tabs: Array<{ value: string; label: string }> = [
    { value: "summary", label: "Summary" },
    { value: "visuals", label: "Visuals" },
    { value: "mentor", label: "Mentor" },
    { value: "chat", label: "Ask" },
    { value: "audio", label: "Audio" },
  ];
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-secondary">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="relative mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "summary" && <SummaryTab bookId={bookId} chapter={chapter} />}
            {tab === "visuals" && <VisualsTab bookId={bookId} chapter={chapter} />}
            {tab === "mentor" && <MentorTab bookId={bookId} chapter={chapter} />}
            {tab === "chat" && <ChatTab bookId={bookId} chapter={chapter} />}
            {tab === "audio" && <AudioTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
