import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { ProgressRing } from "@/components/progress-ring";
import { useReadingStore } from "@/store/reading";
import { CATALOG, getBook } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/lib/auth-context";
import { getMyLibrary, setBookStatus as setBookStatusFn } from "@/server/library";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Lumina Books" },
      { name: "description", content: "Your reading progress, highlights, and saved volumes." },
      { property: "og:title", content: "My Library — Lumina Books" },
      { property: "og:description", content: "Your reading progress, highlights, and saved volumes." },
    ],
  }),
  component: LibraryRoute,
});

function LibraryRoute() {
  return (
    <AuthGate>
      <LibraryPage />
    </AuthGate>
  );
}

function LibraryPage() {
  const { session } = useAuth();
  const progress = useReadingStore((s) => s.progress);
  const setStatus = useReadingStore((s) => s.setStatus);
  const setProgress = useReadingStore((s) => s.setProgress);

  // Hydrate local store from the DB on login
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getMyLibrary().then((res) => {
      if (cancelled || res.error || !res.entries) return;
      for (const e of res.entries) {
        const slug = (e as { book?: { slug?: string } }).book?.slug;
        if (!slug) continue;
        setProgress(slug, {
          chapter: e.current_chapter ?? 0,
          scrollRatio: e.scroll_ratio ?? 0,
          status: (e.status as "reading" | "completed" | "to-read" | "paused") ?? "reading",
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, setProgress]);

  // Wrap setStatus to also sync to DB
  const handleStatus = (slug: string, status: "reading" | "completed" | "to-read" | "paused") => {
    setStatus(slug, status);
    if (session) {
      setBookStatusFn({ data: { slug, status } }).catch(() => {});
    }
  };

  const entries = Object.values(progress);
  const reading = entries.filter((e) => e.status === "reading");
  const completed = entries.filter((e) => e.status === "completed");
  const toRead = entries.filter((e) => e.status === "to-read");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-walnut">Your Shelf</p>
          <h1 className="mt-2 font-display text-4xl text-obsidian sm:text-5xl">My Library</h1>
          <p className="mt-4 max-w-xl font-serif italic text-espresso/70">
            Saved locally to your device. Pick up where you left off, or set a new tome aside for later.
          </p>
        </motion.div>

        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-16">
            {reading.length > 0 && <Shelf title="Continue Reading" entries={reading} onStatus={handleStatus} />}
            {toRead.length > 0 && <Shelf title="To Read" entries={toRead} onStatus={handleStatus} />}
            {completed.length > 0 && <Shelf title="Completed" entries={completed} onStatus={handleStatus} />}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-secondary text-walnut">
        <BookOpen className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl text-obsidian">Your shelf awaits its first volume.</h2>
      <p className="mx-auto mt-3 max-w-md font-serif italic text-espresso/70">
        Pick up a book — your progress, highlights, and notes will collect here.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {CATALOG.slice(0, 4).map((b, i) => (
          <BookCard key={b.id} book={b} index={i} />
        ))}
      </div>
      <Link to="/" className="mt-8 inline-block">
        <Button variant="outline">Browse the full library</Button>
      </Link>
    </div>
  );
}

interface ShelfProps {
  title: string;
  entries: ReturnType<typeof useReadingStore.getState>["progress"][string][];
  onStatus: (bookId: string, status: "reading" | "completed" | "to-read" | "paused") => void;
}

function Shelf({ title, entries, onStatus }: ShelfProps) {
  return (
    <section>
      <h2 className="mb-6 font-display text-2xl text-obsidian">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => {
          const book = getBook(entry.bookId);
          if (!book) return null;
          const total = entry.totalChapters ?? 1;
          const ratio = Math.min(1, (entry.chapter + entry.scrollRatio) / Math.max(1, total));
          return (
            <div
              key={entry.bookId}
              className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-paper transition hover:border-gold/60 hover:shadow-leaf"
            >
              <ProgressRing value={ratio} size={64} stroke={6} label="Reading progress" />
              <div className="min-w-0 flex-1">
                <Link
                  to="/read/$bookId/$chapter"
                  params={{ bookId: book.id, chapter: String(entry.chapter) }}
                  className="block"
                >
                  <h3 className="truncate font-display text-lg text-obsidian hover:text-walnut">
                    {book.title}
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {book.author} · ch. {entry.chapter + 1}
                    {entry.totalChapters ? ` / ${entry.totalChapters}` : ""}
                  </p>
                </Link>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(["reading", "to-read", "completed", "paused"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatus(book.id, s)}
                      className={`rounded-full border px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider transition ${
                        entry.status === s
                          ? "border-walnut bg-walnut text-ivory"
                          : "border-border bg-background text-espresso/60 hover:border-gold"
                      }`}
                    >
                      {s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
