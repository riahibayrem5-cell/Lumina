import { useEffect, useState } from "react";
import { Loader2, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownProse } from "@/components/markdown-prose";
import { Skeleton } from "@/components/ui/skeleton";
import {
  summarizeByTitle,
  listMyTitleSummaries,
  deleteTitleSummary,
} from "@/server/title-summary";
import { toast } from "sonner";

type Mode = "overview" | "chapter";

interface HistoryItem {
  id: string;
  title: string;
  author: string | null;
  mode: string;
  chapter_label: string | null;
  created_at: string;
}

export function TitleSummaryPanel() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [mode, setMode] = useState<Mode>("overview");
  const [chapterLabel, setChapterLabel] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refreshHistory = async () => {
    const r = await listMyTitleSummaries();
    if (!r.error) setHistory(r.items as HistoryItem[]);
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const generate = async (fresh = false) => {
    if (!title.trim()) {
      toast.error("Enter a book title.");
      return;
    }
    if (mode === "chapter" && !chapterLabel.trim()) {
      toast.error('Enter a chapter (e.g. "Chapter 3" or "The Hounds of God").');
      return;
    }
    setLoading(true);
    setError(null);
    setContent("");
    setCached(false);
    try {
      const r = await summarizeByTitle({
        data: {
          title: title.trim(),
          author: author.trim() || undefined,
          mode,
          chapterLabel: mode === "chapter" ? chapterLabel.trim() : undefined,
          fresh,
        },
      });
      if (r.error) setError(r.error);
      else {
        setContent(r.content);
        setCached(r.cached);
        refreshHistory();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = async (item: HistoryItem) => {
    setTitle(item.title);
    setAuthor(item.author ?? "");
    setMode(item.mode as Mode);
    setChapterLabel(item.chapter_label ?? "");
    setLoading(true);
    setError(null);
    setContent("");
    const r = await summarizeByTitle({
      data: {
        title: item.title,
        author: item.author ?? undefined,
        mode: item.mode as Mode,
        chapterLabel: item.chapter_label ?? undefined,
      },
    });
    setLoading(false);
    if (r.error) setError(r.error);
    else {
      setContent(r.content);
      setCached(r.cached);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTitleSummary({ data: { id } });
    refreshHistory();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-walnut" />
            <h3 className="font-display text-xl text-obsidian">Summarize any book by title</h3>
          </div>
          <p className="mb-5 font-serif text-sm italic text-espresso/70">
            For modern or copyrighted works we cannot host. The mentor draws on what
            it already knows — quality varies for obscure titles.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ts-title">Title</Label>
              <Input
                id="ts-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Name of the Wind"
              />
            </div>
            <div>
              <Label htmlFor="ts-author">Author (optional but recommended)</Label>
              <Input
                id="ts-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Patrick Rothfuss"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["overview", "chapter"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-wider transition ${
                  mode === m
                    ? "border-walnut bg-walnut text-ivory"
                    : "border-border bg-background text-espresso/70 hover:border-gold"
                }`}
              >
                {m === "overview" ? "Whole book" : "Chapter / section"}
              </button>
            ))}
          </div>

          {mode === "chapter" && (
            <div className="mt-4">
              <Label htmlFor="ts-ch">Chapter or section</Label>
              <Input
                id="ts-ch"
                value={chapterLabel}
                onChange={(e) => setChapterLabel(e.target.value)}
                placeholder='e.g. "Chapter 5" or "The Bone-Pile"'
              />
            </div>
          )}

          <div className="mt-5 flex items-center gap-2">
            <Button onClick={() => generate(false)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Composing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" /> Summarize
                </>
              )}
            </Button>
            {content && (
              <Button variant="ghost" onClick={() => generate(true)} disabled={loading}>
                <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
              </Button>
            )}
            {cached && (
              <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                · cached
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-3 rounded-2xl border border-border bg-card/30 p-6">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="mt-6 h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-9/12" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
            <p className="font-serif italic text-espresso">{error}</p>
          </div>
        )}

        {content && !loading && (
          <div className="rounded-2xl border border-border bg-card/30 p-8">
            <MarkdownProse content={content} />
          </div>
        )}
      </div>

      <aside>
        <h4 className="mb-3 font-display text-base text-obsidian">Your recent</h4>
        {history.length === 0 ? (
          <p className="font-serif text-sm italic text-espresso/60">
            Summaries you generate will collect here.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="group flex items-start gap-2 rounded-lg border border-border/70 bg-card p-3 transition hover:border-gold/60"
              >
                <button onClick={() => loadFromHistory(h)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-display text-sm text-obsidian">{h.title}</p>
                  <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                    {h.author ? `${h.author} · ` : ""}
                    {h.mode === "chapter" ? h.chapter_label || "Chapter" : "Overview"}
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
